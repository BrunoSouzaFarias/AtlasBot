import { NextRequest } from 'next/server';
import { chat } from '@/lib/ai/chain';
import prisma from '@/lib/db/prisma';
import { chatRequestSchema } from '@/lib/validation';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { FALLBACK_PHRASE } from '@/lib/ai/prompts';

// Streaming de LLM pode passar do timeout default de function na Vercel
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 mensagens por 5 minutos por IP (endpoint público)
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`chat:${ip}`, 20, 5 * 60_000);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

    const body = await request.json().catch(() => null);
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }
    const { message, sessionId, conversationId } = parsed.data;

    // Get or create conversation — a conversa só continua se pertencer ao
    // mesmo sessionId (impede ler/continuar conversa alheia por cuid adivinhado)
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } },
      });
      if (conversation && conversation.sessionId !== (sessionId || 'anonymous')) {
        conversation = null;
      }
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { sessionId: sessionId || 'anonymous' },
        include: { messages: true },
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // Build chat history — as mensagens vêm em `desc` (10 mais recentes);
    // reverter para ordem cronológica antes de montar o histórico
    const chatHistory = [...conversation.messages]
      .reverse()
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Get AI response with RAG
    const { stream, sources } = await chat(message, chatHistory);

    // Collect the full response for saving
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send conversation ID first
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'meta', conversationId: conversation.id, sources: sources.map(s => ({ documentName: s.documentName, score: s.score })) })}\n\n`
          )
        );

        try {
          const result = await stream;
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`)
            );
          }

          // Save assistant message
          const savedMessage = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: 'assistant',
              content: fullResponse,
              sources: JSON.stringify(sources.map(s => ({
                documentName: s.documentName,
                score: s.score,
              }))),
            },
          });

          // Record unanswered questions (best-effort)
          try {
            const hasNoSources = sources.length === 0;
            const maxScore = sources.length > 0 ? Math.max(...sources.map(s => s.score)) : 0;
            const isLowScore = maxScore < 0.45;
            const containsFallback = fullResponse.includes(FALLBACK_PHRASE);

            if (hasNoSources || isLowScore || containsFallback) {
              const cleanedQuestion = message.trim();
              const existingQuestion = await prisma.unansweredQuestion.findFirst({
                where: { question: cleanedQuestion },
              });

              if (existingQuestion) {
                await prisma.unansweredQuestion.update({
                  where: { id: existingQuestion.id },
                  data: { count: { increment: 1 } },
                });
              } else {
                await prisma.unansweredQuestion.create({
                  data: { question: cleanedQuestion, count: 1 },
                });
              }
            }
          } catch (err) {
            console.error('Failed to log unanswered question:', err);
          }

          // messageId permite ao cliente enviar feedback 👍/👎 real
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', messageId: savedMessage.id })}\n\n`)
          );
          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', content: 'Erro ao gerar resposta.' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
