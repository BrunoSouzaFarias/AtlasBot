import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    // Saca conversas ativas ou em espera (não listamos conversas resolvidas pelo BOT a menos que solicitado)
    const conversations = await prisma.conversation.findMany({
      where: {
        status: {
          in: ['WAITING', 'ACTIVE'],
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        userName: true,
        userCpf: true,
        userEmail: true,
        userUnit: true,
        statusChangedAt: true,
        updatedAt: true,
      },
    });

    const decryptedConversations = conversations.map((conv) => ({
      ...conv,
      userName: decrypt(conv.userName),
      userCpf: decrypt(conv.userCpf),
      userEmail: decrypt(conv.userEmail),
    }));

    return Response.json({ conversations: decryptedConversations });
  } catch (error) {
    console.error('Fetch dashboard chats error:', error);
    return Response.json({ error: 'Erro ao buscar conversas ativas' }, { status: 500 });
  }
}
