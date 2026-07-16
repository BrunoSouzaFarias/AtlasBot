'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  MessageSquare,
  User,
  Clock,
  PhoneCall,
  XCircle,
  Play,
  Monitor,
  MonitorOff,
  UserCheck,
  Building2,
  Mail,
  Send,
  Loader2,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface ConversationItem {
  id: string;
  status: 'BOT' | 'WAITING' | 'ACTIVE' | 'CLOSED';
  userName: string | null;
  userCpf: string | null;
  userEmail: string | null;
  userUnit: string | null;
  statusChangedAt: string;
  updatedAt: string;
}

interface MessageItem {
  id?: string;
  role: 'user' | 'assistant' | 'agent' | 'system';
  content: string;
  createdAt?: string;
}

function WaitingTime({ statusChangedAt }: { statusChangedAt: string }) {
  const [elapsed, setElapsed] = useState('00:00');
  const [isOverSLA, setIsOverSLA] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const start = new Date(statusChangedAt).getTime();
      const now = Date.now();
      const diffMs = now - start;

      if (isNaN(start)) {
        setElapsed('00:00');
        return;
      }

      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;

      setIsOverSLA(mins >= 5);
      setElapsed(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [statusChangedAt]);

  return (
    <span
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border select-none ${
        isOverSLA
          ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
          : 'bg-slate-100 border-slate-200 text-slate-500'
      }`}
    >
      Fila: {elapsed}
    </span>
  );
}

export default function DashboardChats() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Estados do WebRTC
  const [isScreenShareActive, setIsScreenShareActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const queuedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Buscar lista de chats ativos
  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const res = await fetch('/api/dashboard/chats');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, []);

  // Polling para novas conversas na fila a cada 6 segundos
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Alerta sonoro quando um novo chamado entra no estado WAITING
  const prevWaitingIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentWaiting = conversations.filter(c => c.status === 'WAITING');
    const hasNewWaiting = currentWaiting.some(c => !prevWaitingIdsRef.current.has(c.id));
    
    if (hasNewWaiting && conversations.length > 0) {
      // Toca sinal sonoro (sino suave)
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');
      audio.volume = 0.4;
      audio.play().catch(err => console.warn('Autoplay bloqueado pelo navegador:', err));
    }
    
    prevWaitingIdsRef.current = new Set(currentWaiting.map(c => c.id));
  }, [conversations]);

  // Carregar histórico de mensagens ao selecionar um chat
  const handleSelectChat = async (chat: ConversationItem) => {
    cleanupWebRTC();

    setSelectedChat(chat);
    setMessages([]);
    try {
      const res = await fetch(`/api/chats/history?conversationId=${chat.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        toast('error', 'Erro ao carregar histórico.');
      }
    } catch {
      toast('error', 'Erro de comunicação ao obter mensagens.');
    }
  };

  // Rolar para baixo ao receber novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Limpeza das conexões WebRTC
  const cleanupWebRTC = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    queuedCandidatesRef.current = [];
    setIsScreenShareActive(false);
  }, []);

  // Enviar comando para parar visualização de tela
  const stopScreenShare = useCallback(async () => {
    if (!selectedChat) return;
    cleanupWebRTC();

    await fetch('/api/chat/webrtc/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: selectedChat.id,
        signal: { type: 'stop_screen_share' },
      }),
    });
  }, [selectedChat, cleanupWebRTC]);

  // Listener SSE para mensagens em tempo real e WebRTC
  useEffect(() => {
    if (!selectedChat) return;

    const eventSource = new EventSource(`/api/chat/stream?conversationId=${selectedChat.id}`);

    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'message') {
          const newMsg = data.payload;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                id: newMsg.id,
                role: newMsg.role as any,
                content: newMsg.content,
                createdAt: newMsg.createdAt,
              },
            ];
          });
        } else if (data.type === 'status') {
          const { status } = data.payload;
          setSelectedChat((prev) => (prev ? { ...prev, status } : null));
          fetchConversations(true);

          if (status === 'CLOSED') {
            cleanupWebRTC();
          }
        } else if (data.type === 'webrtc') {
          const signal = data.payload;

          if (signal.type === 'offer' && selectedChat) {
            setIsScreenShareActive(true);
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
              console.warn('Erro ao obter servidores TURN no dashboard:', err);
            }

            const pc = new RTCPeerConnection({ iceServers });
            peerConnectionRef.current = pc;

            pc.ontrack = (trackEvent) => {
              if (videoRef.current && trackEvent.streams[0]) {
                videoRef.current.srcObject = trackEvent.streams[0];
              }
            };

            pc.onicecandidate = (iceEvent) => {
              if (iceEvent.candidate) {
                fetch('/api/chat/webrtc/signal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    conversationId: selectedChat.id,
                    signal: { type: 'candidate', candidate: iceEvent.candidate },
                  }),
                });
              }
            };

            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
            
            // Processar candidatos acumulados
            while (queuedCandidatesRef.current.length > 0) {
              const cand = queuedCandidatesRef.current.shift();
              if (cand) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch((err) => {
                  console.warn('Erro ao processar ICE candidate da fila no dashboard:', err);
                });
              }
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await fetch('/api/chat/webrtc/signal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                conversationId: selectedChat.id,
                signal: { type: 'answer', sdp: answer.sdp },
              }),
            });
          } else if (signal.type === 'candidate' && peerConnectionRef.current) {
            const pc = peerConnectionRef.current;
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch((err) => {
                console.warn('Erro ao adicionar ICE candidate imediatamente no dashboard:', err);
              });
            } else {
              queuedCandidatesRef.current.push(signal.candidate);
            }
          } else if (signal.type === 'stop_screen_share') {
            cleanupWebRTC();
          }
        }
      } catch (err) {
        console.error('Error parsing SSE event in Dashboard:', err);
      }
    };

    return () => {
      eventSource.close();
      cleanupWebRTC();
    };
  }, [selectedChat, fetchConversations, cleanupWebRTC]);

  // Alterar status da conversa (Assumir ou Encerrar)
  const handleUpdateStatus = async (status: 'ACTIVE' | 'CLOSED') => {
    if (!selectedChat) return;

    try {
      const res = await fetch('/api/chat/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedChat.id,
          status,
        }),
      });

      if (res.ok) {
        setSelectedChat((prev) => (prev ? { ...prev, status } : null));
        fetchConversations(true);
        toast('success', status === 'ACTIVE' ? 'Você assumiu a conversa.' : 'Conversa encerrada.');
      } else {
        toast('error', 'Falha ao atualizar status.');
      }
    } catch {
      toast('error', 'Erro ao se conectar ao servidor.');
    }
  };

  // Enviar sinal de requisição de tela
  const requestScreenShare = async () => {
    if (!selectedChat) return;

    try {
      const res = await fetch('/api/chat/webrtc/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedChat.id,
          signal: { type: 'request_screen_share' },
        }),
      });

      if (res.ok) {
        toast('success', 'Solicitação de tela enviada ao cliente.');
      } else {
        toast('error', 'Erro ao solicitar compartilhamento.');
      }
    } catch {
      toast('error', 'Erro ao se conectar ao servidor.');
    }
  };

  // Enviar mensagem como Técnico/Agente
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !inputText.trim() || sendingMessage) return;

    const messageToSend = inputText.trim();
    setInputText('');
    setSendingMessage(true);

    try {
      const res = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedChat.id,
          message: messageToSend,
        }),
      });

      if (!res.ok) {
        toast('error', 'Erro ao enviar mensagem.');
        setInputText(messageToSend);
      }
    } catch {
      toast('error', 'Erro de rede ao enviar.');
      setInputText(messageToSend);
    } finally {
      setSendingMessage(false);
    }
  };

  // Excluir dados pessoais do solicitante (LGPD - Direito ao Esquecimento)
  const handleLgpdForget = async () => {
    if (!selectedChat) return;
    if (
      !confirm(
        'Deseja realmente remover permanentemente todos os dados pessoais e o histórico deste chamado em conformidade com a LGPD? Esta ação não pode ser desfeita.'
      )
    )
      return;

    try {
      const res = await fetch('/api/chat/lgpd/forget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedChat.id }),
      });

      if (res.ok) {
        toast('success', 'Dados do cliente removidos sob as regras da LGPD.');
        setSelectedChat(prev =>
          prev
            ? {
                ...prev,
                userName: '[ANONIMIZADO]',
                userCpf: '[ANONIMIZADO]',
                userEmail: '[ANONIMIZADO]',
              }
            : null
        );
        setMessages([]); // limpa mensagens localmente
        fetchConversations(true);
      } else {
        toast('error', 'Falha ao remover dados pessoais.');
      }
    } catch {
      toast('error', 'Erro ao se conectar ao servidor.');
    }
  };

  return (
    <AppShell title="Atendimento Humano" description="Gerenciamento de chamados N2 e suporte remoto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
        
        {/* Painel Esquerdo: Fila de Chats (Tema Claro) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col h-full lg:col-span-1 min-w-0 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 select-none border-b border-slate-100 pb-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Fila de Atendimento ({conversations.length})
          </h2>

          {loadingList ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <User className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">Sem chamados pendentes no momento</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {conversations.map((chat) => {
                const isSelected = selectedChat?.id === chat.id;
                // Destaca chamado se estiver WAITING por mais de 5 minutos (SLA N1)
                const waitStart = new Date(chat.statusChangedAt).getTime();
                const isOverSLA = chat.status === 'WAITING' && !isNaN(waitStart) && (Date.now() - waitStart) >= 5 * 60 * 1000;

                return (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 cursor-pointer outline-none ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm'
                        : isOverSLA
                        ? 'bg-rose-50/80 border-rose-300 text-rose-900 animate-pulse'
                        : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2 w-full">
                      <span className="font-bold text-xs truncate max-w-[120px]">
                        {chat.userName || 'Anônimo'}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold select-none ${
                          chat.status === 'WAITING'
                            ? 'bg-rose-50 border border-rose-100 text-rose-600'
                            : 'bg-blue-50 border border-blue-100 text-blue-600'
                        }`}
                      >
                        {chat.status === 'WAITING' ? 'Aguardando' : 'Ativo'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate">{chat.userUnit || 'Unidade não informada'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 select-none mt-1">
                      <span className="font-mono">ID: {chat.id.substring(0, 8)}...</span>
                      {chat.status === 'WAITING' ? (
                        <WaitingTime statusChangedAt={chat.statusChangedAt} />
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(chat.updatedAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel Central: Chat Selecionado (Tema Claro) */}
        <div className="lg:col-span-3 flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden min-w-0 shadow-sm">
          {selectedChat ? (
            <div className="flex-1 flex flex-col min-h-0 relative">
              {/* Barra Superior do Chat */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 select-none">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 leading-tight">
                    <User className="w-4 h-4 text-blue-600" />
                    {selectedChat.userName}
                  </h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-5050 text-xs mt-1 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {selectedChat.userUnit}
                    </span>
                    <span>•</span>
                    <span>CPF: {selectedChat.userCpf}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {selectedChat.userEmail}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                  {selectedChat.status === 'WAITING' ? (
                    <button
                      onClick={() => handleUpdateStatus('ACTIVE')}
                      className="w-full sm:w-auto text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 select-none cursor-pointer shadow-sm"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Assumir Chat
                    </button>
                  ) : (
                    <>
                      {isScreenShareActive ? (
                        <button
                          onClick={stopScreenShare}
                          className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 select-none cursor-pointer"
                        >
                          <MonitorOff className="w-3.5 h-3.5" />
                          Parar Tela
                        </button>
                      ) : (
                        <button
                          onClick={requestScreenShare}
                          className="text-xs px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-bold rounded-lg flex items-center justify-center gap-1 select-none cursor-pointer transition-all"
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          Solicitar Tela
                        </button>
                      )}
                      <button
                        onClick={handleLgpdForget}
                        className="text-xs px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 flex items-center justify-center gap-1 select-none cursor-pointer transition-all"
                        title="Apagar dados pessoais deste solicitante de forma definitiva sob as regras da LGPD"
                      >
                        Limpar Dados (LGPD)
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('CLOSED')}
                        className="text-xs px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-lg border border-slate-200 flex items-center justify-center gap-1 select-none cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        Encerrar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Área de Layout do Chat + Vídeo WebRTC */}
              <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Janela de Mensagens */}
                <div className="flex-1 flex flex-col justify-between min-h-0 bg-slate-50 p-4">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
                    {messages.map((msg, index) => {
                      const isAgentMsg = msg.role === 'agent';
                      const isUserMsg = msg.role === 'user';
                      const isSystemMsg = msg.role === 'system';

                      if (isSystemMsg) {
                        return (
                          <div key={index} className="flex justify-center my-2">
                            <span className="px-3.5 py-1.5 bg-slate-200/80 border border-slate-300 rounded-full text-slate-600 text-xs text-center max-w-[80%] font-semibold shadow-sm select-none">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={index}
                          className={`flex gap-2 max-w-[80%] ${
                            isAgentMsg ? 'ml-auto flex-row-reverse' : ''
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] select-none font-bold shadow-sm ${
                              isAgentMsg ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 border border-slate-300'
                            }`}
                          >
                            {isAgentMsg ? 'T' : isUserMsg ? 'U' : 'B'}
                          </div>

                          <div className="space-y-1">
                            <div
                              className={`p-3 rounded-xl text-xs leading-relaxed shadow-sm ${
                                isAgentMsg
                                  ? 'bg-blue-600 text-white rounded-tr-none'
                                  : 'bg-white border border-slate-250/80 text-slate-800 rounded-tl-none'
                              }`}
                            >
                              <div className="whitespace-pre-wrap select-text">{msg.content}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input de Mensagem */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <input
                      type="text"
                      disabled={selectedChat.status !== 'ACTIVE' || sendingMessage}
                      placeholder={
                        selectedChat.status === 'ACTIVE'
                          ? 'Digite a resposta do suporte...'
                          : 'Assuma a conversa para poder responder...'
                      }
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 bg-transparent text-slate-800 rounded-lg px-2 py-2 text-xs focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={selectedChat.status !== 'ACTIVE' || !inputText.trim() || sendingMessage}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center justify-center disabled:opacity-50 select-none cursor-pointer"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>
                </div>

                {/* Tela do Cliente Recebida (WebRTC Video) */}
                {isScreenShareActive && (
                  <div className="w-full md:w-1/2 border-t md:border-t-0 md:border-l border-slate-200 bg-slate-950 flex flex-col shrink-0 select-none relative animate-fade-in">
                    <div className="absolute top-3 left-3 bg-red-650/90 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      TELA DO CLIENTE (AO VIVO)
                    </div>
                    <div className="flex-1 flex items-center justify-center p-2 min-h-[220px]">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-auto max-h-full object-contain rounded-lg border border-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <EmptyState
                icon={<MessageSquare className="w-12 h-12 text-slate-350" />}
                title="Selecione um chamado"
                description="Clique em algum atendimento ativo na fila lateral para visualizar os detalhes e conversar."
              />
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
