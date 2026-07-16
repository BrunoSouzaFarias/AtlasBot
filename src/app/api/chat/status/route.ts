import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { emitChatEvent } from '@/lib/chats/events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const { conversationId, status } = body || {};

    if (!conversationId || !status) {
      return Response.json(
        { error: 'conversationId e status são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['BOT', 'WAITING', 'ACTIVE', 'CLOSED'].includes(status)) {
      return Response.json({ error: 'Status inválido' }, { status: 400 });
    }

    // Se o status for ACTIVE (assumido por técnico) ou CLOSED (encerrado por técnico),
    // exige autenticação do admin/técnico.
    // Se for WAITING (solicitado pelo cliente), é um endpoint aberto ao cliente.
    if (['ACTIVE', 'CLOSED'].includes(status)) {
      const unauthorized = await requireAdmin(request);
      if (unauthorized) return unauthorized;
    }

    // Buscar a conversa existente
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return Response.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Criar uma mensagem de sistema baseada na mudança de status
    let systemText = '';
    if (status === 'WAITING') {
      systemText = 'Solicitando transferência para um técnico humano...';
    } else if (status === 'ACTIVE') {
      systemText = 'Técnico de Suporte Liberty TI entrou na conversa.';
    } else if (status === 'CLOSED') {
      systemText = 'Atendimento encerrado pelo técnico.';
    }

    // Atualizar conversa no banco
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        status,
        statusChangedAt: new Date(),
      },
    });

    let systemMsg = null;
    if (systemText) {
      systemMsg = await prisma.message.create({
        data: {
          conversationId,
          role: 'system',
          content: systemText,
        },
      });
    }

    // Gerar resumo assíncrono e persistir se for transição para WAITING
    let summaryMsg = null;
    if (status === 'WAITING') {
      try {
        const previousMessages = await prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'asc' },
        });

        const { summarizeConversation } = await import('@/lib/ai/chain');
        const summaryText = await summarizeConversation(previousMessages);

        summaryMsg = await prisma.message.create({
          data: {
            conversationId,
            role: 'system',
            content: `📝 Resumo da conversa com o Bot:\n${summaryText}`,
          },
        });
      } catch (err) {
        console.error('Failed to auto-summarize conversation on escalation:', err);
      }
    }

    // Notificar todas as partes via SSE da mudança de status
    emitChatEvent(conversationId, {
      type: 'status',
      conversationId,
      payload: {
        status,
        userName: updatedConversation.userName,
        userCpf: updatedConversation.userCpf,
        userEmail: updatedConversation.userEmail,
        userUnit: updatedConversation.userUnit,
      },
    });

    if (systemMsg) {
      emitChatEvent(conversationId, {
        type: 'message',
        conversationId,
        payload: systemMsg,
      });
    }

    if (summaryMsg) {
      emitChatEvent(conversationId, {
        type: 'message',
        conversationId,
        payload: summaryMsg,
      });
    }

    return Response.json({ success: true, status: updatedConversation.status });
  } catch (error) {
    console.error('Update chat status error:', error);
    return Response.json({ error: 'Erro ao atualizar status da conversa' }, { status: 500 });
  }
}
