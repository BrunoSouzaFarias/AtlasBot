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
import { useToast } from '@/components/ui/Toast';

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
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados do gerenciador de gaps de conhecimento
  const [activeGap, setActiveGap] = useState<{ id: string; question: string } | null>(null);
  const [gapAnswer, setGapAnswer] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolveGap = async () => {
    if (!activeGap || resolvingId) return;
    setResolvingId(activeGap.id);

    try {
      const res = await fetch('/api/documents/gap-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeGap.question,
          answer: gapAnswer,
          questionId: activeGap.id,
        }),
      });

      if (res.ok) {
        if (data) {
          setData({
            ...data,
            unansweredQuestions: data.unansweredQuestions.filter(q => q.id !== activeGap.id),
            totalDocuments: data.totalDocuments + 1,
          });
        }
        toast('success', 'Resposta cadastrada e gap de conhecimento resolvido na Wiki!');
        setActiveGap(null);
      } else {
        toast('error', 'Falha ao salvar a resposta do gap.');
      }
    } catch {
      toast('error', 'Erro de rede ao salvar resposta do gap.');
    } finally {
      setResolvingId(null);
    }
  };

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
                      className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-100/50 transition-all shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-mono text-slate-400">
                          ID: {conv.id.substring(0, 8)}...
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(conv.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="space-y-2 mt-3">
                        {conv.messages.slice(0, 2).map((msg, i) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <span className="font-semibold shrink-0 flex items-center gap-1 text-slate-700">
                              {msg.role === 'user' ? (
                                <>
                                  <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />{' '}
                                  Cliente:
                                </>
                              ) : (
                                <>
                                  <Bot className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />{' '}
                                  LibertyBot:
                                </>
                              )}
                            </span>
                            <span className="text-slate-600 line-clamp-1">{msg.content}</span>
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
                icon={<AlertCircle className="w-5 h-5 text-amber-500" aria-hidden="true" />}
                title="Gaps de Conhecimento"
                description="Perguntas frequentes que o bot não soube responder. Use para atualizar sua wiki."
              />
              <div className="space-y-3">
                {data?.unansweredQuestions && data.unansweredQuestions.length > 0 ? (
                  data.unansweredQuestions.map(q => (
                    <div
                      key={q.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2.5 shadow-sm hover:border-slate-300 transition-all animate-fade-in"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-slate-800 line-clamp-3">
                          {q.question}
                        </span>
                        <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded shrink-0 select-none">
                          {q.count}x
                        </span>
                      </div>
                      
                      <button
                        onClick={() => {
                          setActiveGap(q);
                          setGapAnswer('');
                        }}
                        className="w-full text-center text-[10px] font-bold py-1 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-all cursor-pointer select-none"
                      >
                        Alimentar Base
                      </button>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Nenhum gap registrado" description="A IA está mandando bem! 🚀" />
                )}
              </div>
            </Card>
          </div>

          {/* Modal / Popup de Resolução de Gaps */}
          {activeGap && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-md w-full space-y-4 shadow-xl">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Alimentar Base de Conhecimento</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Cadastre a resposta correta para essa dúvida. O chatbot aprenderá e saberá responder nas próximas consultas.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs font-semibold text-slate-700">
                  <span className="font-bold text-slate-400 block mb-1 uppercase text-[9px]">Dúvida do Solicitante:</span>
                  "{activeGap.question}"
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Resposta da TI *</label>
                  <textarea
                    required
                    rows={4}
                    value={gapAnswer}
                    onChange={(e) => setGapAnswer(e.target.value)}
                    placeholder="VPN: Abra o FortiClient, conecte-se ao gateway vpn.liberty.com..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveGap(null)}
                    className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={resolvingId !== null || !gapAnswer.trim()}
                    onClick={handleResolveGap}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {resolvingId ? 'Salvando...' : 'Salvar e Publicar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
