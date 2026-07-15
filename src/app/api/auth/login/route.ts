import { NextRequest } from 'next/server';
import { createSessionToken, verifyPassword, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validation';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Brute force: 5 tentativas por minuto por IP
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`login:${ip}`, 5, 60_000);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Senha é obrigatória' }, { status: 400 });
    }

    if (!verifyPassword(parsed.data.password)) {
      // 401 genérico — não distinguir "senha errada" de "senha não configurada"
      return Response.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const token = await createSessionToken();
    const response = Response.json({ success: true });
    const opts = sessionCookieOptions();
    response.headers.set(
      'Set-Cookie',
      `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=${opts.sameSite}; Path=${opts.path}; Max-Age=${opts.maxAge}${opts.secure ? '; Secure' : ''}`
    );
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
