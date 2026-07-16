import { NextRequest } from 'next/server';
import { subscribeToChat } from '@/lib/chats/events';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return Response.json({ error: 'conversationId é obrigatório' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    start(controller) {
      // Ping a cada 15 segundos para manter a conexão ativa em proxies e Cloudflare
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          // A stream pode já ter sido fechada
          clearInterval(keepAlive);
        }
      }, 15000);

      // Assinar eventos da conversa específica
      const unsubscribe = subscribeToChat(conversationId, (event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          clearInterval(keepAlive);
          unsubscribe();
        }
      });

      // Fechar recursos ao abortar a requisição
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        unsubscribe();
      });
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
