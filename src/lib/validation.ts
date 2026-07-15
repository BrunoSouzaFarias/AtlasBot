import { z } from 'zod';

// --- Chat ---
export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Mensagem é obrigatória').max(4000, 'Mensagem muito longa (máx. 4000 caracteres)'),
  sessionId: z.string().max(64).optional(),
  conversationId: z.string().cuid().optional(),
});

// --- Feedback ---
export const feedbackSchema = z.object({
  messageId: z.string().cuid(),
  feedback: z.enum(['positive', 'negative']),
});

// --- Login ---
export const loginSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória').max(256),
});

// --- Upload de documentos ---
// Limite de 4 MB por arquivo: o body de serverless functions na Vercel é ~4.5 MB.
export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'] as const;
export const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
export const MAX_FILES = 5;

export function validateUploadFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return `Tipo de arquivo não suportado: "${file.name}". Aceitos: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Arquivo "${file.name}" excede o limite de 4 MB`;
  }
  if (file.size === 0) {
    return `Arquivo "${file.name}" está vazio`;
  }
  return null;
}
