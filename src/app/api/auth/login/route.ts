import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import {
  createSessionToken,
  comparePassword,
  hashPassword,
  sessionCookieOptions,
  SESSION_COOKIE,
} from '@/lib/auth/session';
import { loginSchema } from '@/lib/validation';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Defesa brute-force: 5 tentativas por minuto por IP
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`login:${ip}`, 5, 60_000);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    // Auto-seed: cria o primeiro usuário administrador se a tabela estiver vazia
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const defaultPass = process.env.ADMIN_PASSWORD || 'liberty123';
      await prisma.user.create({
        data: {
          email: 'admin@liberty.com',
          name: 'Administrador Liberty',
          password: hashPassword(defaultPass),
          role: 'ADMIN',
        },
      });
      console.log('Auto-seed: primeiro usuário admin criado (admin@liberty.com)');
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (!user || !comparePassword(password, user.password)) {
      return Response.json(
        { error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    // Criar Token de Sessão JWT
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'AGENT' | 'ADMIN',
    });

    const response = Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    const opts = sessionCookieOptions();
    response.headers.set(
      'Set-Cookie',
      `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=${opts.sameSite}; Path=${opts.path}; Max-Age=${opts.maxAge}${
        opts.secure ? '; Secure' : ''
      }`
    );

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return Response.json(
      { error: 'Erro interno ao realizar login' },
      { status: 500 }
    );
  }
}
