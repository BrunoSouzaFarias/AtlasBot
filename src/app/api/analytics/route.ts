import { NextRequest } from 'next/server';
import { format, startOfDay, subDays } from 'date-fns';
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

    // Série de mensagens/dia (últimos 14 dias) — agregada em JS para ser
    // portátil entre SQLite (dev) e Postgres (prod), sem SQL raw
    const fourteenDaysAgo = startOfDay(subDays(now, 13));
    const recentMessageDates = await prisma.message.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    });
    const countsByDay = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      countsByDay.set(format(subDays(now, i), 'yyyy-MM-dd'), 0);
    }
    for (const { createdAt } of recentMessageDates) {
      const key = format(createdAt, 'yyyy-MM-dd');
      if (countsByDay.has(key)) {
        countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
      }
    }
    const messagesPerDay = Array.from(countsByDay.entries()).map(([date, count]) => ({
      date,
      count,
    }));

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
      messagesPerDay,
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return Response.json(
      { error: 'Erro ao buscar analytics' },
      { status: 500 }
    );
  }
}
