import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import type { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'liberty_admin';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    // Caso de fallback para desenvolvimento
    return new TextEncoder().encode('default-super-secret-auth-key-32-chars-long!');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: 'AGENT' | 'ADMIN';
}

/** Cria o token JWT de sessão para o operador técnico (HS256). */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

/** Verifica se o token de sessão é válido e retorna o payload decodificado. */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as 'AGENT' | 'ADMIN',
    };
  } catch {
    return null;
  }
}

/**
 * Gera um hash pbkdf2 com salt randômico para armazenamento seguro de senhas.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Compara a senha informada com o hash salvo no banco usando tempo constante.
 */
export function comparePassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch {
    return false;
  }
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
 * Valida se existe um cookie de sessão válido.
 * Retorna null se autenticado, ou Response 401 se inválido.
 */
export async function requireAdmin(request: NextRequest): Promise<Response | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (payload) return null; // Acesso liberado para técnicos autorizados
  return Response.json({ error: 'Não autorizado' }, { status: 401 });
}

/**
 * Restringe o acesso estritamente a administradores (ADMIN).
 * Retorna null se for ADMIN, ou Response 403 se for apenas AGENT.
 */
export async function requireStrictAdmin(request: NextRequest): Promise<Response | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (payload && payload.role === 'ADMIN') return null;
  return Response.json({ error: 'Apenas administradores permitidos' }, { status: 403 });
}
