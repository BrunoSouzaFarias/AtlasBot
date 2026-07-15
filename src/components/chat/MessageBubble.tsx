'use client';

import React from 'react';
import { Bot, User, ThumbsUp, ThumbsDown, Loader2, FileText } from 'lucide-react';
import Markdown from './Markdown';
import type { ChatMessage } from '@/hooks/useChatStream';

export default function MessageBubble({
  message,
  primaryColor,
  onFeedback,
}: {
  message: ChatMessage;
  primaryColor: string;
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center select-none ${
          isUser ? 'bg-slate-800 text-slate-200' : ''
        }`}
        style={!isUser ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : {}}
        aria-hidden="true"
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bolha */}
      <div className="space-y-2 min-w-0">
        <div
          className={`p-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-none text-white'
              : 'bg-slate-900/80 border border-slate-800/60 rounded-tl-none text-slate-200'
          }`}
          style={isUser ? { backgroundColor: primaryColor } : {}}
        >
          {message.attachmentUrl && (
            <div className="mb-2 max-w-[260px] overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/40">
              <img
                src={message.attachmentUrl}
                alt="Captura de tela"
                className="w-full h-auto object-cover max-h-[180px] hover:scale-[1.03] transition-transform duration-200 cursor-pointer"
                onClick={() => window.open(message.attachmentUrl, '_blank')}
                title="Clique para abrir em nova guia"
              />
            </div>
          )}

          {message.content ? (
            isUser ? (
              <div className="whitespace-pre-wrap select-text">{message.content}</div>
            ) : (
              <Markdown content={message.content} />
            )
          ) : (
            <div className="flex items-center gap-2 text-slate-400 py-1 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" aria-hidden="true" />
              Buscando na Wiki...
            </div>
          )}
        </div>

        {/* Fontes + Feedback */}
        {!isUser && message.content && !message.error && (
          <div className="flex flex-col gap-2 pl-1">
            {message.sources && message.sources.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                <span>Fontes:</span>
                {message.sources.slice(0, 3).map((src, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-900 border border-slate-800/80 rounded text-[10px] text-slate-400 font-medium max-w-[150px] truncate"
                    title={`${src.documentName} (Relevância: ${Math.round(src.score * 100)}%)`}
                  >
                    <FileText className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                    {src.documentName}
                  </span>
                ))}
              </div>
            )}

            {onFeedback && message.id && (
              <div className="flex items-center gap-2 text-xs text-slate-400 select-none">
                <span>Esta resposta foi útil?</span>
                <button
                  onClick={() => onFeedback(message.id!, 'positive')}
                  aria-label="Resposta útil"
                  aria-pressed={message.feedback === 'positive'}
                  className={`p-1 hover:text-emerald-400 hover:bg-slate-900 rounded transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                    message.feedback === 'positive' ? 'text-emerald-400 bg-slate-900' : ''
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => onFeedback(message.id!, 'negative')}
                  aria-label="Resposta não foi útil"
                  aria-pressed={message.feedback === 'negative'}
                  className={`p-1 hover:text-rose-400 hover:bg-slate-900 rounded transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                    message.feedback === 'negative' ? 'text-rose-400 bg-slate-900' : ''
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
