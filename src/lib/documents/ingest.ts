import prisma from '@/lib/db/prisma';
import { parseDocument } from './parser';
import { chunkText } from './chunker';
import { upsertChunks, deleteDocumentChunks, type ChunkMetadata } from '@/lib/ai/vectorstore';

export interface IngestResult {
  documentId: string;
  chunksCreated: number;
  status: 'success' | 'error';
  error?: string;
}

export async function ingestDocument(
  file: File
): Promise<IngestResult> {
  const fileType = file.name.split('.').pop()?.toLowerCase() || '';
  const fileName = file.name;

  // 1. Create document record
  const document = await prisma.document.create({
    data: {
      name: fileName,
      type: fileType,
      content: '',
      status: 'processing',
    },
  });

  try {
    // 2. Parse the document
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseDocument(buffer, fileType);

    // 3. Chunk the content
    const chunks = chunkText(parsed.content, {
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // 4. Generate embeddings and store in vector DB (with try/catch fallback)
    try {
      const chunkTexts = chunks.map(c => c.content);
      const chunkMetadata: ChunkMetadata[] = chunks.map(c => ({
        documentId: document.id,
        documentName: fileName,
        chunkIndex: c.index,
        content: c.content,
      }));

      await upsertChunks(chunkTexts, chunkMetadata);
    } catch (vectorError) {
      console.warn('Qdrant vector store offline or error. Storing document only in local database.', vectorError);
    }

    // 5. Update document record
    await prisma.document.update({
      where: { id: document.id },
      data: {
        content: parsed.content, // Store full content for local search fallback
        chunks: chunks.length,
        status: 'ready',
      },
    });

    return {
      documentId: document.id,
      chunksCreated: chunks.length,
      status: 'success',
    };
  } catch (error) {
    console.error('Ingest error:', error);
    // Update document as error
    await prisma.document.update({
      where: { id: document.id },
      data: { status: 'error' },
    });

    return {
      documentId: document.id,
      chunksCreated: 0,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  // Delete from vector DB (with try/catch fallback)
  try {
    await deleteDocumentChunks(documentId);
  } catch (error) {
    console.warn('Could not delete chunks from vector store, Qdrant offline:', error);
  }

  // Delete from database
  await prisma.document.delete({
    where: { id: documentId },
  });
}
