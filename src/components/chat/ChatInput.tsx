'use client';

import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';

export default function ChatInput({
  onSend,
  disabled,
  primaryColor,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  primaryColor: string;
}) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || disabled) return;
    setInput('');
    onSend(text);
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800/80 bg-slate-950 shrink-0">
      <div className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={disabled}
          maxLength={4000}
          aria-label="Digite sua mensagem"
          placeholder="Digite sua dúvida de suporte técnico..."
          className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-cyan-500/80 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          aria-label="Enviar mensagem"
          className="absolute right-2 p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
          style={input.trim() && !disabled ? { color: primaryColor } : {}}
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div className="text-[10px] text-center text-slate-500 mt-2 font-medium tracking-wide flex items-center justify-center gap-1 select-none">
        Powered by <MessageSquare className="w-3 h-3 text-cyan-500/80" aria-hidden="true" /> Liberty TI
      </div>
    </form>
  );
}
