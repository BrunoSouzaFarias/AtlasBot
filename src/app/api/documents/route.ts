import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { ingestDocument, deleteDocument } from '@/lib/documents/ingest';
import { requireAdmin } from '@/lib/auth/session';
import { validateUploadFile, MAX_FILES } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

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
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return Response.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return Response.json(
        { error: `Envie no máximo ${MAX_FILES} arquivos por vez` },
        { status: 400 }
      );
    }

    // Valida TODOS os arquivos antes de ingerir qualquer um
    for (const file of files) {
      const validationError = validateUploadFile(file);
      if (validationError) {
        const isSizeError = validationError.includes('excede');
        return Response.json(
          { error: validationError },
          { status: isSizeError ? 413 : 400 }
        );
      }
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
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

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
