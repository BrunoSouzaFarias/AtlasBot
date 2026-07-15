'use client';

import React, { useEffect, useRef } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useChatStream } from '@/hooks/useChatStream';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import { useToast } from '@/components/ui/Toast';

const DEFAULT_WELCOME = 'Olá! Como posso ajudar você hoje no suporte da Liberty TI?';
const DEFAULT_COLOR = '#06b6d4';

function WidgetContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const primaryColor = searchParams.get('color') || DEFAULT_COLOR;
  const welcomeMsg = searchParams.get('welcome') || DEFAULT_WELCOME;

  // Boas-vindas como estado inicial (sem setState em effect)
  const { messages, send, setFeedback, loading } = useChatStream([
    { role: 'assistant', content: welcomeMsg },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFeedback = async (messageId: string, type: 'positive' | 'negative') => {
    const ok = await setFeedback(messageId, type);
    if (!ok) toast('error', 'Não foi possível salvar seu feedback. Tente novamente.');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 border-b border-slate-800/80 shrink-0 select-none"
        style={{ borderTop: `4px solid ${primaryColor}` }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
          aria-hidden="true"
        >
          <Bot className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-sm text-white leading-tight">Suporte Liberty TI</h1>
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
            Assistente Virtual Inteligente
          </span>
        </div>
      </div>

      {/* Mensagens */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Mensagens da conversa"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id ?? index}
            message={msg}
            primaryColor={primaryColor}
            onFeedback={handleFeedback}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={send} disabled={loading} primaryColor={primaryColor} />
    </div>
  );
}

export default function WidgetPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-2" aria-hidden="true" />
          <p className="text-sm font-medium">Carregando widget...</p>
        </div>
      }
    >
      <WidgetContent />
    </React.Suspense>
  );
}
