import { SignJWT, jwtVerify } from 'jose';
import { timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'liberty_admin';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET não configurado (mínimo 32 caracteres). Gere com: openssl rand -base64 32');
  }
  return new TextEncoder().encode(secret);
}

/** Cria o token JWT de sessão admin (HS256, expira em 7 dias). */
export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

/** Verifica se o token de sessão é válido e pertence a um admin. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

/** Compara a senha informada com ADMIN_PASSWORD em tempo constante. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error('ADMIN_PASSWORD não configurado — login admin desabilitado.');
    return false;
  }
  const inputBuf = Buffer.from(input);
  const expectedBuf = Buffer.from(expected);
  // timingSafeEqual exige buffers do mesmo tamanho; compara contra si mesmo
  // quando difere para manter tempo constante sem revelar o tamanho.
  if (inputBuf.length !== expectedBuf.length) {
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return timingSafeEqual(inputBuf, expectedBuf);
}

/** Opções do cookie de sessão (usar com cookies().set / NextResponse). */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  };
}

/**
 * Defesa em profundidade nas route handlers admin: valida o cookie de sessão
 * mesmo que o matcher do proxy deixe de cobrir a rota em algum refactor.
 * Retorna uma Response 401 se não autorizado, ou null se OK.
 */
export async function requireAdmin(request: NextRequest): Promise<Response | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) return null;
  return Response.json({ error: 'Não autorizado' }, { status: 401 });
}
