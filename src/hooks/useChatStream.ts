'use client';

import { useCallback, useRef, useState } from 'react';

export interface ChatSource {
  documentName: string;
  score: number;
}

export interface ChatMessage {
  id?: string; // messageId do banco (chega no evento 'done') — habilita feedback
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  feedback?: 'positive' | 'negative' | null;
  attachmentUrl?: string;
  error?: boolean;
}

/**
 * Hook de chat com streaming SSE.
 * - Buffer acumulado: eventos SSE podem chegar fracionados entre chunks de
 *   rede; só processamos segmentos completos terminados em "\n\n".
 * - Estado sempre imutável (map + spread) — nada de mutação direta.
 * - sessionId é gerado no primeiro envio (event handler), não na renderização.
 */
export function useChatStream(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const updateLastAssistant = useCallback(
    (patch: Partial<ChatMessage> | ((msg: ChatMessage) => Partial<ChatMessage>)) => {
      setMessages(prev => {
        const lastIndex = prev.length - 1;
        if (lastIndex < 0 || prev[lastIndex].role !== 'assistant') return prev;
        const resolved = typeof patch === 'function' ? patch(prev[lastIndex]) : patch;
        return prev.map((m, i) => (i === lastIndex ? { ...m, ...resolved } : m));
      });
    },
    []
  );

  const send = useCallback(
    async (text: string, attachmentUrl?: string) => {
      const message = text.trim();
      if (!message || loading) return;

      // Gerado aqui (event handler) e não na renderização — regra do React Compiler
      if (!sessionIdRef.current) {
        sessionIdRef.current = Math.random().toString(36).substring(2, 15);
      }

      setLoading(true);
      setMessages(prev => [
        ...prev,
        { role: 'user', content: message, attachmentUrl },
        { role: 'assistant', content: '' },
      ]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            sessionId: sessionIdRef.current,
            conversationId: conversationIdRef.current ?? undefined,
            attachmentUrl,
          }),
        });

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? 'Falha ao iniciar o chat');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantText = '';
        let sources: ChatSource[] = [];

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Processa apenas eventos completos; o resto fica no buffer
          const segments = buffer.split('\n\n');
          buffer = segments.pop() ?? '';

          for (const segment of segments) {
            const line = segment.trim();
            if (!line.startsWith('data: ')) continue;

            let data: { type: string; [k: string]: unknown };
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (data.type === 'meta') {
              if (typeof data.conversationId === 'string') {
                conversationIdRef.current = data.conversationId;
              }
              if (Array.isArray(data.sources)) {
                sources = data.sources as ChatSource[];
              }
            } else if (data.type === 'text') {
              assistantText += data.content as string;
              const snapshot = assistantText;
              updateLastAssistant({ content: snapshot, sources });
            } else if (data.type === 'done') {
              if (typeof data.messageId === 'string') {
                updateLastAssistant({ id: data.messageId });
              }
            } else if (data.type === 'error') {
              throw new Error(String(data.content ?? 'Erro ao gerar resposta'));
            }
          }
        }

        if (!assistantText) {
          throw new Error('Resposta vazia');
        }
      } catch (err) {
        console.error('Chat error:', err);
        updateLastAssistant({
          content:
            'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
          error: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, updateLastAssistant]
  );

  /** Feedback otimista com rollback; retorna false se falhar. */
  const setFeedback = useCallback(
    async (messageId: string, feedback: 'positive' | 'negative'): Promise<boolean> => {
      const apply = (value: 'positive' | 'negative' | null) =>
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? { ...m, feedback: value } : m))
        );

      apply(feedback);
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, feedback }),
        });
        if (!res.ok) throw new Error('feedback failed');
        return true;
      } catch {
        apply(null); // rollback
        return false;
      }
    },
    []
  );

  return { messages, setMessages, send, setFeedback, loading };
}
