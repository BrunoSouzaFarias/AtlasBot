import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return Response.json(
        { error: 'conversationId é obrigatório' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return Response.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    const formattedMessages = conversation.messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'agent' | 'system',
      content: decrypt(m.content) as string,
      createdAt: m.createdAt,
      attachmentUrl: m.attachmentUrl,
      sources: m.sources ? JSON.parse(m.sources) : undefined,
      feedback: m.feedback,
    }));

    return Response.json({
      conversationId: conversation.id,
      status: conversation.status,
      userName: decrypt(conversation.userName),
      userCpf: decrypt(conversation.userCpf),
      userEmail: decrypt(conversation.userEmail),
      userUnit: conversation.userUnit,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return Response.json({ error: 'Erro ao buscar histórico de mensagens' }, { status: 500 });
  }
}
