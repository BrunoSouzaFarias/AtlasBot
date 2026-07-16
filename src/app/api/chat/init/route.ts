import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { encrypt } from '@/lib/crypto';

const initRequestSchema = z.object({
  userName: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  userCpf: z.string().trim().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'CPF inválido'),
  userEmail: z.string().trim().email('E-mail inválido'),
  userUnit: z.string().trim().min(2, 'Unidade é obrigatória'),
  sessionId: z.string().max(64),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = initRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { userName, userCpf, userEmail, userUnit, sessionId } = parsed.data;
    const cleanCpf = userCpf.replace(/\D/g, ''); // Salva apenas os números do CPF

    // Criar a conversa com os metadados criptografados e o status inicial BOT
    const conversation = await prisma.conversation.create({
      data: {
        sessionId,
        status: 'BOT',
        userName: encrypt(userName),
        userCpf: encrypt(cleanCpf),
        userEmail: encrypt(userEmail),
        userUnit,
      },
    });

    return Response.json({
      conversationId: conversation.id,
      status: conversation.status,
    });
  } catch (error) {
    console.error('Chat Init API error:', error);
    return Response.json(
      { error: 'Erro ao inicializar conversa' },
      { status: 500 }
    );
  }
}
