import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total conversations
    const totalConversations = await prisma.conversation.count();

    // Total messages
    const totalMessages = await prisma.message.count();

    // Messages last 30 days
    const recentMessages = await prisma.message.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Feedback stats
    const positiveFeedback = await prisma.message.count({
      where: { feedback: 'positive' },
    });

    const negativeFeedback = await prisma.message.count({
      where: { feedback: 'negative' },
    });

    // Total documents
    const totalDocuments = await prisma.document.count({
      where: { status: 'ready' },
    });

    // Unanswered questions
    const unansweredQuestions = await prisma.unansweredQuestion.findMany({
      orderBy: { count: 'desc' },
      take: 10,
    });

    // Recent conversations
    const recentConversations = await prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 2,
        },
      },
    });

    const satisfactionRate =
      positiveFeedback + negativeFeedback > 0
        ? Math.round((positiveFeedback / (positiveFeedback + negativeFeedback)) * 100)
        : 0;

    return Response.json({
      totalConversations,
      totalMessages,
      recentMessages,
      positiveFeedback,
      negativeFeedback,
      satisfactionRate,
      totalDocuments,
      unansweredQuestions,
      recentConversations,
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return Response.json(
      { error: 'Erro ao buscar analytics' },
      { status: 500 }
    );
  }
}
