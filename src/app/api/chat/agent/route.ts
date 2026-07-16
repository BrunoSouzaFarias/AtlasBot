import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { emitChatEvent } from '@/lib/chats/events';

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const { conversationId, message } = body || {};

    if (!conversationId || !message?.trim()) {
      return Response.json(
        { error: 'conversationId e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a conversa existe e está ativa
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return Response.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Salvar a mensagem do agente
    const savedMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'agent',
        content: message.trim(),
      },
    });

    // Notificar cliente e outros técnicos conectados via SSE
    emitChatEvent(conversationId, {
      type: 'message',
      conversationId,
      payload: savedMessage,
    });

    return Response.json({ success: true, message: savedMessage });
  } catch (error) {
    console.error('Agent message error:', error);
    return Response.json({ error: 'Erro ao enviar mensagem do técnico' }, { status: 500 });
  }
}
