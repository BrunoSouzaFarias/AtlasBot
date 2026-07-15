import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { ingestDocument, deleteDocument } from '@/lib/documents/ingest';

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        chunks: true,
        status: true,
        createdAt: true,
      },
    });

    return Response.json({ documents });
  } catch (error) {
    console.error('Documents GET error:', error);
    return Response.json(
      { error: 'Erro ao buscar documentos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return Response.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    const results = [];
    for (const file of files) {
      const result = await ingestDocument(file);
      results.push(result);
    }

    return Response.json({ results });
  } catch (error) {
    console.error('Documents POST error:', error);
    return Response.json(
      { error: 'Erro ao processar documentos' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { error: 'ID do documento é obrigatório' },
        { status: 400 }
      );
    }

    await deleteDocument(id);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Documents DELETE error:', error);
    return Response.json(
      { error: 'Erro ao deletar documento' },
      { status: 500 }
    );
  }
}
