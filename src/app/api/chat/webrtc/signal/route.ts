import { NextRequest } from 'next/server';
import { emitChatEvent } from '@/lib/chats/events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const { conversationId, signal } = body || {};

    if (!conversationId || !signal) {
      return Response.json(
        { error: 'conversationId e sinal de sinalização são obrigatórios' },
        { status: 400 }
      );
    }

    // Retransmite o sinal WebRTC (SDP offer/answer, ICE Candidates) via SSE
    emitChatEvent(conversationId, {
      type: 'webrtc',
      conversationId,
      payload: signal,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('WebRTC signal routing error:', error);
    return Response.json({ error: 'Erro ao rotear sinalização WebRTC' }, { status: 500 });
  }
}
