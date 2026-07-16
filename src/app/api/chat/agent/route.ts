import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { emitChatEvent } from '@/lib/chats/events';
import { encrypt, decrypt } from '@/lib/crypto';

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

    // Salvar a mensagem do agente criptografada no banco
    const savedMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'agent',
        content: encrypt(message.trim()) as string,
      },
    });

    // Notificar cliente e outros técnicos conectados via SSE com a mensagem descriptografada
    const decryptedPayload = {
      ...savedMessage,
      content: decrypt(savedMessage.content) as string,
    };

    emitChatEvent(conversationId, {
      type: 'message',
      conversationId,
      payload: decryptedPayload,
    });

    return Response.json({ success: true, message: decryptedPayload });
  } catch (error) {
    console.error('Agent message error:', error);
    return Response.json({ error: 'Erro ao enviar mensagem do técnico' }, { status: 500 });
  }
}
