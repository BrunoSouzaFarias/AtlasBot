import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { emitChatEvent } from '@/lib/chats/events';

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const { conversationId } = body || {};

    if (!conversationId) {
      return Response.json(
        { error: 'conversationId é obrigatório' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return Response.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Anonimizar metadados do solicitante em conformidade com a LGPD
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        userName: '[ANONIMIZADO]',
        userCpf: '[ANONIMIZADO]',
        userEmail: '[ANONIMIZADO]',
      },
    });

    // Deletar mensagens de chat associadas para apagar o histórico de dados
    await prisma.message.deleteMany({
      where: { conversationId },
    });

    // Criar mensagem de sistema notificando a exclusão
    const systemMsg = await prisma.message.create({
      data: {
        conversationId,
        role: 'system',
        content: '🔒 Os dados pessoais e o histórico deste atendimento foram removidos permanentemente em conformidade com a LGPD (Direito ao Esquecimento).',
      },
    });

    // Emitir eventos para atualizar o painel em tempo real
    emitChatEvent(conversationId, {
      type: 'message',
      conversationId,
      payload: systemMsg,
    });

    emitChatEvent(conversationId, {
      type: 'status',
      conversationId,
      payload: {
        status: conversation.status,
        userName: '[ANONIMIZADO]',
        userCpf: '[ANONIMIZADO]',
        userEmail: '[ANONIMIZADO]',
        userUnit: conversation.userUnit,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('LGPD Forget API error:', error);
    return Response.json(
      { error: 'Erro ao remover dados pessoais sob demanda da LGPD' },
      { status: 500 }
    );
  }
}
