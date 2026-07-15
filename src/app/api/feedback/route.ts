import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { feedbackSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'messageId e feedback (positive/negative) são obrigatórios' },
        { status: 400 }
      );
    }

    const { messageId, feedback } = parsed.data;

    // updateMany com filtro de role: só mensagens do assistant recebem feedback
    const result = await prisma.message.updateMany({
      where: { id: messageId, role: 'assistant' },
      data: { feedback },
    });

    if (result.count === 0) {
      return Response.json({ error: 'Mensagem não encontrada' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Feedback POST error:', error);
    return Response.json(
      { error: 'Erro ao salvar feedback' },
      { status: 500 }
    );
  }
}
