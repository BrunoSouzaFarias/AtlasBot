import { NextRequest } from 'next/server';
import { chat } from '@/lib/ai/chain';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, conversationId } = await request.json();

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } },
      });
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

    // Build chat history
    const chatHistory = conversation.messages.map(m => ({
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
          await prisma.message.create({
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

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );
          controller.close();
        } catch (error) {
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
