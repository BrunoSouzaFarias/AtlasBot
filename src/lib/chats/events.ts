import { EventEmitter } from 'events';

// Garantir que o EventEmitter sobreviva a hot reloads do Next.js em desenvolvimento
const globalForEvents = globalThis as unknown as {
  chatEmitterInstance?: EventEmitter;
};

export const chatEventEmitter = globalForEvents.chatEmitterInstance ?? new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.chatEmitterInstance = chatEventEmitter;
}

// Tipagem dos eventos para consistência
export interface ChatEvent {
  type: 'message' | 'status' | 'webrtc';
  conversationId: string;
  payload: any;
}

export function emitChatEvent(conversationId: string, event: ChatEvent) {
  chatEventEmitter.emit(`chat:${conversationId}`, event);
  // Também emitir em um canal global para o painel de controle dos técnicos verem atualizações gerais
  chatEventEmitter.emit('chat:global', event);
}

export function subscribeToChat(conversationId: string, listener: (event: ChatEvent) => void) {
  const eventKey = `chat:${conversationId}`;
  chatEventEmitter.on(eventKey, listener);
  return () => {
    chatEventEmitter.off(eventKey, listener);
  };
}

export function subscribeToGlobalChats(listener: (event: ChatEvent) => void) {
  chatEventEmitter.on('chat:global', listener);
  return () => {
    chatEventEmitter.off('chat:global', listener);
  };
}
