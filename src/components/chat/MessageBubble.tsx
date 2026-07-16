'use client';

import React from 'react';
import { Bot, User, ThumbsUp, ThumbsDown, Loader2, FileText, UserCheck } from 'lucide-react';
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
  const isAgent = message.role === 'agent';
  const isSystem = message.role === 'system';

  // Mensagens de sistema centralizadas e discretas no tema claro
  if (isSystem) {
    return (
      <div className="flex justify-center w-full my-2 animate-fade-in">
        <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-500 text-xs font-semibold text-center max-w-[90%] select-none shadow-sm">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''} animate-fade-in`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center select-none shadow-sm ${
          isUser ? 'bg-slate-150 text-slate-650 border border-slate-200' : ''
        }`}
        style={!isUser ? { backgroundColor: `${primaryColor}15`, color: primaryColor, border: `1px solid ${primaryColor}25` } : {}}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : isAgent ? (
          <UserCheck className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Bolha */}
      <div className="space-y-2 min-w-0">
        <div
          className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'rounded-tr-none text-white'
              : isAgent
              ? 'bg-blue-50 border border-blue-100 rounded-tl-none text-slate-800'
              : 'bg-white border border-slate-200/80 rounded-tl-none text-slate-850'
          }`}
          style={isUser ? { backgroundColor: primaryColor } : {}}
        >
          {message.attachmentUrl && (
            <div className="mb-2 max-w-[260px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
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
            isUser || isAgent ? (
              <div className="whitespace-pre-wrap select-text font-normal">{message.content}</div>
            ) : (
              <Markdown content={message.content} />
            )
          ) : (
            <div className="flex items-center gap-2 text-slate-500 py-1 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
              Buscando na Wiki...
            </div>
          )}
        </div>

        {/* Fontes + Feedback (apenas para o Assistant da IA) */}
        {message.role === 'assistant' && message.content && !message.error && (
          <div className="flex flex-col gap-2 pl-1 select-none">
            {message.sources && message.sources.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                <span>Fontes:</span>
                {message.sources.slice(0, 3).map((src, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 font-semibold max-w-[150px] truncate"
                    title={`${src.documentName} (Relevância: ${Math.round(src.score * 100)}%)`}
                  >
                    <FileText className="w-2.5 h-2.5 shrink-0 text-slate-500" aria-hidden="true" />
                    {src.documentName}
                  </span>
                ))}
              </div>
            )}

            {onFeedback && message.id && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Esta resposta foi útil?</span>
                <button
                  onClick={() => onFeedback(message.id!, 'positive')}
                  aria-label="Resposta útil"
                  aria-pressed={message.feedback === 'positive'}
                  className={`p-1 hover:text-emerald-600 hover:bg-slate-100 rounded transition-all cursor-pointer outline-none ${
                    message.feedback === 'positive' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : ''
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => onFeedback(message.id!, 'negative')}
                  aria-label="Resposta não foi útil"
                  aria-pressed={message.feedback === 'negative'}
                  className={`p-1 hover:text-rose-600 hover:bg-slate-100 rounded transition-all cursor-pointer outline-none ${
                    message.feedback === 'negative' ? 'text-rose-600 bg-rose-50 border border-rose-100' : ''
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
