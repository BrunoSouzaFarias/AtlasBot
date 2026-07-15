'use client';

import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Files,
  ThumbsUp,
  AlertCircle,
  Clock,
  TrendingUp,
  User,
  Bot,
  XCircle,
  BarChart3,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import StatCard from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import BarChart, { type DayPoint } from '@/components/dashboard/BarChart';
import SatisfactionDonut from '@/components/dashboard/SatisfactionDonut';

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
  messagesPerDay: DayPoint[];
}

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
        setError(null);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Não foi possível carregar as métricas. Verifique sua conexão e recarregue a página.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <AppShell title="Dashboard" description="Métricas de atendimento N1 e performance da IA">
      {loading ? (
        <Spinner label="Carregando métricas da Liberty TI..." className="py-24" />
      ) : error ? (
        <EmptyState
          icon={<XCircle className="w-12 h-12" />}
          title="Erro ao carregar métricas"
          description={error}
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total de Conversas"
              value={data?.totalConversations ?? 0}
              icon={<MessageSquare className="w-6 h-6" />}
              accent="cyan"
            />
            <StatCard
              label="Total de Mensagens"
              value={data?.totalMessages ?? 0}
              icon={<TrendingUp className="w-6 h-6" />}
              accent="blue"
              hint={`${data?.recentMessages ?? 0} nos últimos 30 dias`}
            />
            <StatCard
              label="Taxa de Satisfação"
              value={`${data?.satisfactionRate ?? 0}%`}
              icon={<ThumbsUp className="w-6 h-6" />}
              accent="emerald"
              hint={`${(data?.positiveFeedback ?? 0) + (data?.negativeFeedback ?? 0)} avaliações`}
            />
            <StatCard
              label="Documentos na Wiki"
              value={data?.totalDocuments ?? 0}
              icon={<Files className="w-6 h-6" />}
              accent="violet"
            />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader
                icon={<BarChart3 className="w-5 h-5 text-cyan-400" aria-hidden="true" />}
                title="Mensagens por dia"
                description="Volume de mensagens nos últimos 14 dias"
              />
              {data?.messagesPerDay && (
                <BarChart data={data.messagesPerDay} label="Mensagens por dia" />
              )}
            </Card>
            <Card>
              <CardHeader
                icon={<ThumbsUp className="w-5 h-5 text-emerald-400" aria-hidden="true" />}
                title="Satisfação"
                description="Distribuição do feedback dos usuários"
              />
              <SatisfactionDonut
                positive={data?.positiveFeedback ?? 0}
                negative={data?.negativeFeedback ?? 0}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Conversas recentes */}
            <Card className="lg:col-span-2">
              <CardHeader
                icon={<Clock className="w-5 h-5 text-cyan-400" aria-hidden="true" />}
                title="Conversas Recentes (N1)"
              />
              <div className="space-y-4">
                {data?.recentConversations && data.recentConversations.length > 0 ? (
                  data.recentConversations.map(conv => (
                    <div
                      key={conv.id}
                      className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-lg hover:border-slate-700 transition-all"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-mono text-slate-500">
                          ID: {conv.id.substring(0, 8)}...
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(conv.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="space-y-2 mt-3">
                        {conv.messages.slice(0, 2).map((msg, i) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <span className="font-semibold shrink-0 flex items-center gap-1">
                              {msg.role === 'user' ? (
                                <>
                                  <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />{' '}
                                  Cliente:
                                </>
                              ) : (
                                <>
                                  <Bot className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />{' '}
                                  LibertyBot:
                                </>
                              )}
                            </span>
                            <span className="text-slate-300 line-clamp-1">{msg.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Nenhuma conversa registrada ainda" />
                )}
              </div>
            </Card>

            {/* Gaps de conhecimento */}
            <Card>
              <CardHeader
                icon={<AlertCircle className="w-5 h-5 text-amber-400" aria-hidden="true" />}
                title="Gaps de Conhecimento"
                description="Perguntas frequentes que o bot não soube responder. Use para atualizar sua wiki."
              />
              <div className="space-y-3">
                {data?.unansweredQuestions && data.unansweredQuestions.length > 0 ? (
                  data.unansweredQuestions.map(q => (
                    <div
                      key={q.id}
                      className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex justify-between items-center gap-3"
                    >
                      <span className="text-sm text-slate-300 font-medium line-clamp-2">
                        {q.question}
                      </span>
                      <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-md shrink-0">
                        {q.count}x
                      </span>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Nenhum gap registrado" description="A IA está mandando bem! 🚀" />
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}
