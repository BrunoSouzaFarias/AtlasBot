import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const { question, answer, questionId } = body || {};

    if (!question?.trim() || !answer?.trim()) {
      return Response.json(
        { error: 'Pergunta e resposta são obrigatórias' },
        { status: 400 }
      );
    }

    // Criar o documento na base de dados (Wiki)
    const doc = await prisma.document.create({
      data: {
        name: `Resolução de Gap: ${question.substring(0, 40).trim()}...`,
        type: 'txt',
        content: `Pergunta: ${question.trim()}\nResposta: ${answer.trim()}`,
        status: 'ready',
        chunks: 1,
      },
    });

    // Se um ID de Gap correspondente foi fornecido, removemos da fila de pendentes
    if (questionId) {
      await prisma.unansweredQuestion.delete({
        where: { id: questionId },
      }).catch(() => null); // ignora se já tiver sido excluído
    }

    return Response.json({ success: true, documentId: doc.id });
  } catch (error) {
    console.error('Gap resolve API error:', error);
    return Response.json(
      { error: 'Erro interno ao resolver o gap de conhecimento' },
      { status: 500 }
    );
  }
}
