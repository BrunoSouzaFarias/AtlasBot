'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bot, Loader2, User, PhoneCall, MonitorUp, MonitorOff, X, Send } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useChatStream, ChatMessage } from '@/hooks/useChatStream';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import { useToast } from '@/components/ui/Toast';
import unitsData from '@/data/units.json';

const DEFAULT_WELCOME = 'Olá! Como posso ajudar você hoje no suporte da Liberty TI?';
const DEFAULT_COLOR = '#004e92'; // Azul Liberty Health padrão

function WidgetContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const primaryColor = searchParams.get('color') || DEFAULT_COLOR;
  const welcomeMsg = searchParams.get('welcome') || DEFAULT_WELCOME;

  // Estados de Controle de Conversa e Registro
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<'BOT' | 'WAITING' | 'ACTIVE' | 'CLOSED'>('BOT');
  const [showPreChat, setShowPreChat] = useState(true);

  // Campos do formulário
  const [formName, setFormName] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Autocomplete e Consentimento LGPD
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const filteredUnits = unitsData.filter(unit =>
    unit.toLowerCase().includes(unitSearch.toLowerCase())
  ).slice(0, 5);

  // Referência do WebRTC e Captura de Tela
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [showShareRequest, setShowShareRequest] = useState(false);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const queuedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Instancia o hook de chat
  const { messages, setMessages, send, setFeedback, loading } = useChatStream([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>('');

  // Recupera histórico ou estado inicial se já registrado nesta aba
  useEffect(() => {
    const savedConvId = sessionStorage.getItem('liberty_chat_conv_id');
    const savedSessionId = sessionStorage.getItem('liberty_chat_session_id');
    const savedStatus = sessionStorage.getItem('liberty_chat_status') as any;

    if (savedConvId && savedSessionId) {
      setConversationId(savedConvId);
      sessionIdRef.current = savedSessionId;
      setChatStatus(savedStatus || 'BOT');
      setShowPreChat(false);

      // Carregar mensagens anteriores do banco
      fetch(`/api/chats/history?conversationId=${savedConvId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          } else {
            setMessages([{ role: 'assistant', content: welcomeMsg }]);
          }
        })
        .catch(() => {
          setMessages([{ role: 'assistant', content: welcomeMsg }]);
        });
    } else {
      // Inicia mensagens com boas vindas na tela de chat quando o formulário for enviado
      setMessages([{ role: 'assistant', content: welcomeMsg }]);
    }
  }, [welcomeMsg, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Função para formatar CPF enquanto digita
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const clean = raw.slice(0, 11);
    let formatted = clean;
    if (clean.length > 9) {
      formatted = `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    } else if (clean.length > 6) {
      formatted = `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    } else if (clean.length > 3) {
      formatted = `${clean.slice(0, 3)}.${clean.slice(3)}`;
    }
    setFormCpf(formatted);
  };

  // Enviar formulário de pré-cadastro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCpf || !formEmail || !formUnit) {
      toast('error', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!lgpdConsent) {
      toast('error', 'Você precisa aceitar os termos de consentimento da LGPD.');
      return;
    }

    if (!unitsData.includes(formUnit)) {
      toast('error', 'Selecione uma unidade de saúde válida na lista.');
      return;
    }

    const cleanCpf = formCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      toast('error', 'CPF deve possuir 11 dígitos.');
      return;
    }

    setIsSubmitting(true);
    const session = Math.random().toString(36).substring(2, 15);
    sessionIdRef.current = session;

    try {
      const res = await fetch('/api/chat/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: formName,
          userCpf: formCpf,
          userEmail: formEmail,
          userUnit: formUnit,
          sessionId: session,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao registrar.');
      }

      const data = await res.json();
      setConversationId(data.conversationId);
      setChatStatus(data.status);
      setShowPreChat(false);

      // Persistir dados da sessão
      sessionStorage.setItem('liberty_chat_conv_id', data.conversationId);
      sessionStorage.setItem('liberty_chat_session_id', session);
      sessionStorage.setItem('liberty_chat_status', data.status);
    } catch (err: any) {
      toast('error', err.message || 'Falha de comunicação. Verifique a rede.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Solicitar transferência para atendimento humano
  const handleEscalate = async () => {
    if (!conversationId) return;

    try {
      const res = await fetch('/api/chat/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          status: 'WAITING',
        }),
      });

      if (res.ok) {
        setChatStatus('WAITING');
        sessionStorage.setItem('liberty_chat_status', 'WAITING');
      } else {
        toast('error', 'Erro ao solicitar suporte técnico.');
      }
    } catch {
      toast('error', 'Erro ao se conectar ao servidor.');
    }
  };

  // Limpeza do WebRTC e compartilhamento de tela
  const cleanupScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    queuedCandidatesRef.current = [];
    setIsSharingScreen(false);
    setShowShareRequest(false);
  }, []);

  // Iniciar compartilhamento de tela com o técnico
  const startScreenShare = async () => {
    if (!conversationId) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor', // Preferencialmente tela cheia
        },
        audio: false,
      });

      screenStreamRef.current = stream;
      setIsSharingScreen(true);
      setShowShareRequest(false);

      // Obter servidores ICE dinâmicos (TURN/STUN)
      let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
      try {
        const iceRes = await fetch('/api/chat/webrtc/token');
        if (iceRes.ok) {
          const iceData = await iceRes.json();
          if (iceData.iceServers) {
            iceServers = iceData.iceServers;
          }
        }
      } catch (err) {
        console.warn('Erro ao obter servidores TURN, usando STUN padrão:', err);
      }

      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      // Adicionar trilha de vídeo
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        // Escutar se o usuário clicar em "Parar Compartilhamento" no navegador
        track.onended = () => {
          stopScreenShare(true);
        };
      });

      // Sinalizar candidatos ICE para o servidor
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/chat/webrtc/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId,
              signal: { type: 'candidate', candidate: event.candidate },
            }),
          });
        }
      };

      // Criar a oferta de sinalização WebRTC
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await fetch('/api/chat/webrtc/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          signal: { type: 'offer', sdp: offer.sdp },
        }),
      });
    } catch (err) {
      console.error('Erro ao iniciar compartilhamento de tela:', err);
      toast('error', 'Permissão negada ou falha ao capturar a tela.');
      cleanupScreenShare();
    }
  };

  // Parar compartilhamento de tela
  const stopScreenShare = useCallback(async (locallyEnded = false) => {
    cleanupScreenShare();

    if (!locallyEnded && conversationId) {
      // Notificar técnico de que o compartilhamento foi parado
      await fetch('/api/chat/webrtc/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          signal: { type: 'stop_screen_share' },
        }),
      });
    }
  }, [conversationId, cleanupScreenShare]);

  // Listener SSE para mensagens em tempo real e sinalização WebRTC
  useEffect(() => {
    if (!conversationId) return;

    const eventSource = new EventSource(`/api/chat/stream?conversationId=${conversationId}`);

    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'message') {
          const newMsg = data.payload;

          // Se for mensagem de técnico (agent) ou sistema, atualizamos a lista de mensagens
          if (newMsg.role === 'agent' || newMsg.role === 'system') {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [
                ...prev,
                {
                  id: newMsg.id,
                  role: newMsg.role as 'agent' | 'system',
                  content: newMsg.content,
                },
              ];
            });
          }
        } else if (data.type === 'status') {
          const { status } = data.payload;
          setChatStatus(status);
          sessionStorage.setItem('liberty_chat_status', status);

          if (status === 'CLOSED') {
            // Se o atendimento humano acabou, volta para o bot
            setChatStatus('BOT');
            sessionStorage.setItem('liberty_chat_status', 'BOT');
            stopScreenShare(true);
          }
        } else if (data.type === 'webrtc') {
          const signal = data.payload;

          // O técnico solicitou compartilhamento de tela
          if (signal.type === 'request_screen_share') {
            setShowShareRequest(true);
          } else if (signal.type === 'answer' && peerConnectionRef.current) {
            // O técnico respondeu a oferta do WebRTC
            const pc = peerConnectionRef.current;
            await pc.setRemoteDescription(
              new RTCSessionDescription({ type: 'answer', sdp: signal.sdp })
            );
            // Processar candidatos acumulados
            while (queuedCandidatesRef.current.length > 0) {
              const cand = queuedCandidatesRef.current.shift();
              if (cand) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch((err) => {
                  console.warn('Erro ao processar ICE candidate da fila:', err);
                });
              }
            }
          } else if (signal.type === 'candidate' && peerConnectionRef.current) {
            // Candidato ICE do técnico
            const pc = peerConnectionRef.current;
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch((err) => {
                console.warn('Erro ao adicionar ICE candidate imediatamente:', err);
              });
            } else {
              queuedCandidatesRef.current.push(signal.candidate);
            }
          } else if (signal.type === 'stop_screen_share') {
            // O técnico mandou parar o compartilhamento
            cleanupScreenShare();
          }
        }
      } catch (err) {
        console.error('Erro ao processar mensagem SSE do cliente:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('Erro na conexão SSE do cliente. Tentando reconectar automaticamente...');
    };

    return () => {
      eventSource.close();
    };
  }, [conversationId, setMessages, cleanupScreenShare, stopScreenShare]);

  const handleFeedback = async (messageId: string, type: 'positive' | 'negative') => {
    const ok = await setFeedback(messageId, type);
    if (!ok) toast('error', 'Não foi possível salvar seu feedback. Tente novamente.');
  };

  // RENDER 1: Tela de Pré-cadastro (Tema Claro)
  if (showPreChat) {
    return (
      <div className="flex flex-col h-screen bg-white text-slate-800 font-sans p-6 justify-center items-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2 select-none">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              <Bot className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Suporte Liberty TI</h1>
            <p className="text-xs text-slate-500">Preencha os dados abaixo para iniciar seu atendimento.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: José da Silva"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">CPF *</label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={formCpf}
                onChange={handleCpfChange}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">E-mail *</label>
              <input
                type="email"
                required
                placeholder="seuemail@liberty.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="space-y-1 relative">
              <label className="text-xs font-semibold text-slate-500">Unidade de Trabalho *</label>
              <input
                type="text"
                required
                placeholder="Digite e selecione sua unidade..."
                value={unitSearch}
                onChange={(e) => {
                  setUnitSearch(e.target.value);
                  setShowUnitDropdown(true);
                }}
                onFocus={() => setShowUnitDropdown(true)}
                onBlur={() => setTimeout(() => setShowUnitDropdown(false), 200)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              {showUnitDropdown && unitSearch.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-[62px] bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredUnits.length === 0 ? (
                    <div className="p-2.5 text-xs text-slate-400 text-center">Nenhuma unidade encontrada</div>
                  ) : (
                    filteredUnits.map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => {
                          setFormUnit(unit);
                          setUnitSearch(unit);
                          setShowUnitDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 transition-all font-medium border-b border-slate-100 last:border-b-0 cursor-pointer"
                      >
                        {unit}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2.5 pt-1 select-none">
              <input
                id="lgpd-consent"
                type="checkbox"
                checked={lgpdConsent}
                onChange={(e) => setLgpdConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="lgpd-consent" className="text-[10px] text-slate-500 leading-normal cursor-pointer">
                Aceito o tratamento dos meus dados pessoais em conformidade com a **LGPD** para fins de suporte técnico da Liberty Health.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-sm font-bold py-2.5 rounded-lg text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 select-none cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Iniciar Atendimento'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RENDER 2: Tela Principal de Chat (Tema Claro)
  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0 select-none shadow-sm"
        style={{ borderTop: `4px solid ${primaryColor}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            aria-hidden="true"
          >
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-slate-950 leading-tight">
              {chatStatus === 'BOT' ? 'Suporte Liberty TI' : 'Suporte Humano'}
            </h1>
            <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  chatStatus === 'ACTIVE' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                }`}
                aria-hidden="true"
              ></span>
              {chatStatus === 'BOT'
                ? 'Assistente Virtual Inteligente'
                : chatStatus === 'WAITING'
                ? 'Aguardando técnico da fila...'
                : 'Conectado com o Técnico'}
            </span>
          </div>
        </div>

        {/* Botão de Transferir para Humano (Apenas visível se em modo BOT) */}
        {chatStatus === 'BOT' && (
          <button
            onClick={handleEscalate}
            title="Chamar Técnico Humano"
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer select-none"
          >
            <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
            Falar com Técnico
          </button>
        )}
      </div>

      {/* Banner de Compartilhamento de Tela Ativo */}
      {isSharingScreen && (
        <div className="bg-blue-50 border-b border-blue-100 p-2.5 flex items-center justify-between text-xs font-medium animate-fade-in shrink-0 text-blue-800 select-none">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
            Você está compartilhando sua tela com o técnico.
          </span>
          <button
            onClick={() => stopScreenShare(false)}
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-2.5 rounded transition-all select-none cursor-pointer"
          >
            <MonitorOff className="w-3 h-3" />
            Parar
          </button>
        </div>
      )}

      {/* Modal/Prompt de Solicitação de Compartilhamento de Tela */}
      {showShareRequest && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-xs space-y-4 shadow-xl text-center select-none">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
              <MonitorUp className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Solicitação de Tela</h3>
              <p className="text-xs text-slate-500">
                O técnico de suporte solicitou ver a sua tela para poder lhe auxiliar remotamente.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowShareRequest(false)}
                className="flex-1 text-xs py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-lg border border-slate-200 transition-all cursor-pointer"
              >
                Recusar
              </button>
              <button
                onClick={startScreenShare}
                className="flex-1 text-xs py-2 text-white font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Permitir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Mensagens */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Mensagens da conversa"
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
      >
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id ?? index}
            message={msg}
            primaryColor={primaryColor}
            onFeedback={chatStatus === 'BOT' ? handleFeedback : undefined}
          />
        ))}
        {chatStatus === 'WAITING' && (
          <div className="flex gap-3 max-w-[85%] animate-fade-in">
            <div
              className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center select-none"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-white border border-slate-200/80 rounded-2xl rounded-tl-none text-xs text-slate-500 font-medium shadow-sm">
              Encaminhando seu chamado para a nossa equipe técnica. Aguarde um instante...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-slate-200">
        <ChatInput
          onSend={(text, attachment) => send(text, attachment, chatStatus !== 'BOT')}
          disabled={loading || chatStatus === 'WAITING'}
          primaryColor={primaryColor}
        />
      </div>
    </div>
  );
}

export default function WidgetPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" aria-hidden="true" />
          <p className="text-sm font-medium">Carregando widget...</p>
        </div>
      }
    >
      <WidgetContent />
    </React.Suspense>
  );
}
