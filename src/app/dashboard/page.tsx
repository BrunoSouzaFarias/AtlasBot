'use client';

import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Files, 
  ThumbsUp, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  User,
  Bot
} from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  recentMessages: number;
  positiveFeedback: number;
  negativeFeedback: number;
  satisfactionRate: number;
  totalDocuments: number;
  unansweredQuestions: Array<{ id: string; question: string; count: number }>;
  recentConversations: Array<{
    id: string;
    sessionId: string;
    createdAt: string;
    messages: Array<{ role: string; content: string }>;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Carregando métricas da Liberty TI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            LibertyBot Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Métricas de atendimento N1 e performance da IA</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/knowledge" 
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 rounded-lg text-sm font-medium transition-all duration-200"
          >
            Gerenciar Wiki
          </Link>
          <Link 
            href="/settings" 
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200"
          >
            Configurar Bot
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-cyan-950/50 text-cyan-400 rounded-lg border border-cyan-800/30">
              <MessageSquare className="w-6 h-6" />
            </span>
          </div>
          <span className="text-slate-400 text-sm font-medium">Total de Conversas</span>
          <h3 className="text-3xl font-bold mt-1 text-white">{data?.totalConversations || 0}</h3>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-blue-950/50 text-blue-400 rounded-lg border border-blue-800/30">
              <TrendingUp className="w-6 h-6" />
            </span>
          </div>
          <span className="text-slate-400 text-sm font-medium">Total de Mensagens</span>
          <h3 className="text-3xl font-bold mt-1 text-white">{data?.totalMessages || 0}</h3>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-800/30">
              <ThumbsUp className="w-6 h-6" />
            </span>
          </div>
          <span className="text-slate-400 text-sm font-medium">Taxa de Satisfação</span>
          <h3 className="text-3xl font-bold mt-1 text-white">{data?.satisfactionRate || 0}%</h3>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-violet-950/50 text-violet-400 rounded-lg border border-violet-800/30">
              <Files className="w-6 h-6" />
            </span>
          </div>
          <span className="text-slate-400 text-sm font-medium">Documentos na Wiki</span>
          <h3 className="text-3xl font-bold mt-1 text-white">{data?.totalDocuments || 0}</h3>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Conversations */}
          <div className="bg-slate-900/35 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Conversas Recentes (N1)
            </h2>
            <div className="space-y-4">
              {data?.recentConversations && data.recentConversations.length > 0 ? (
                data.recentConversations.map((conv) => (
                  <div key={conv.id} className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-lg hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-slate-500">ID: {conv.id.substring(0, 8)}...</span>
                      <span className="text-xs text-slate-400">
                        {new Date(conv.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="space-y-2 mt-3">
                      {conv.messages.slice(0, 2).map((msg, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <span className="font-semibold shrink-0 flex items-center gap-1">
                            {msg.role === 'user' ? (
                              <><User className="w-3.5 h-3.5 text-slate-400" /> Cliente:</>
                            ) : (
                              <><Bot className="w-3.5 h-3.5 text-cyan-400" /> LibertyBot:</>
                            )}
                          </span>
                          <span className="text-slate-300 line-clamp-1">{msg.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma conversa registrada ainda.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Unanswered Questions */}
          <div className="bg-slate-900/35 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Gaps de Conhecimento
            </h2>
            <p className="text-slate-400 text-xs mb-4">Perguntas frequentes que o bot não soube responder. Use para atualizar sua wiki.</p>
            <div className="space-y-3">
              {data?.unansweredQuestions && data.unansweredQuestions.length > 0 ? (
                data.unansweredQuestions.map((q) => (
                  <div key={q.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex justify-between items-center gap-3">
                    <span className="text-sm text-slate-300 font-medium line-clamp-2">{q.question}</span>
                    <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-md">
                      {q.count}x
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhum gap registrado. A IA está mandando bem! 🚀
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
