import prisma from '@/lib/db/prisma';
import type { NextRequest } from 'next/server';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Rate limiter fixed-window persistido no banco (funciona em serverless,
 * onde contadores in-memory se perdem entre instâncias/cold starts).
 * 1 query extra por request — aceitável para o volume atual; se virar
 * gargalo, migrar para @upstash/ratelimit.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStartCutoff = new Date(now.getTime() - windowMs);

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.windowStart < windowStartCutoff) {
      // Janela nova (ou expirada): reseta o contador
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, windowStart: now, count: 1 },
        update: { windowStart: now, count: 1 },
      });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (existing.count >= limit) {
      const retryAfterMs = existing.windowStart.getTime() + windowMs - now.getTime();
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }

    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { allowed: true, retryAfterSeconds: 0 };
  } catch (err) {
    // Falha no limiter nunca deve derrubar a rota (fail-open)
    console.error('Rate limit check failed:', err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/** Extrai o IP do cliente (na Vercel o x-forwarded-for é confiável). */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'local';
}

/** Resposta 429 padronizada. */
export function rateLimitResponse(retryAfterSeconds: number): Response {
  return Response.json(
    { error: 'Muitas requisições. Tente novamente em instantes.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}
