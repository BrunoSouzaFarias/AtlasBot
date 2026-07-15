import { QdrantClient } from '@qdrant/js-client-rest';
import { generateEmbedding, generateEmbeddings } from './embeddings';
import { v5 as uuidv5 } from 'uuid';

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'liberty_knowledge';
const VECTOR_SIZE = 4096; // nvidia/nv-embed-v1 dimension
const NAMESPACE_FIXO = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Namespace DNS para UUID v5 determinístico

let qdrantClient: QdrantClient | null = null;

function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = process.env.QDRANT_API_KEY;
    qdrantClient = new QdrantClient({
      url,
      apiKey: apiKey || undefined,
    });
  }
  return qdrantClient;
}

export async function ensureCollection(): Promise<void> {
  const client = getQdrantClient();
  const collections = await client.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

  if (!exists) {
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
    });
    console.log(`Collection '${COLLECTION_NAME}' created.`);
  }
}

export interface ChunkMetadata {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
}

export async function upsertChunks(
  chunks: string[],
  metadata: ChunkMetadata[]
): Promise<void> {
  const client = getQdrantClient();
  await ensureCollection();

  const vectors = await generateEmbeddings(chunks);

  const points = vectors.map((vector, index) => ({
    id: uuidv5(`${metadata[index].documentId}-${metadata[index].chunkIndex}`, NAMESPACE_FIXO),
    vector,
    payload: {
      documentId: metadata[index].documentId,
      documentName: metadata[index].documentName,
      chunkIndex: metadata[index].chunkIndex,
      content: metadata[index].content,
    },
  }));

  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    await client.upsert(COLLECTION_NAME, { points: batch });
  }
}

export async function searchSimilar(
  query: string,
  topK: number = 5
): Promise<Array<{ content: string; documentName: string; score: number }>> {
  const client = getQdrantClient();
  const queryVector = await generateEmbedding(query);

  const results = await client.search(COLLECTION_NAME, {
    vector: queryVector,
    limit: topK,
    with_payload: true,
  });

  return results.map(result => ({
    content: (result.payload?.content as string) || '',
    documentName: (result.payload?.documentName as string) || '',
    score: result.score,
  }));
}

export async function deleteDocumentChunks(documentId: string): Promise<void> {
  const client = getQdrantClient();

  await client.delete(COLLECTION_NAME, {
    filter: {
      must: [
        {
          key: 'documentId',
          match: { value: documentId },
        },
      ],
    },
  });
}
