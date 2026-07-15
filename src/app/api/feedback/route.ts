import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const { messageId, feedback } = await request.json();

    if (!messageId || !['positive', 'negative'].includes(feedback)) {
      return Response.json(
        { error: 'messageId e feedback (positive/negative) são obrigatórios' },
        { status: 400 }
      );
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { feedback },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Feedback POST error:', error);
    return Response.json(
      { error: 'Erro ao salvar feedback' },
      { status: 500 }
    );
  }
}
