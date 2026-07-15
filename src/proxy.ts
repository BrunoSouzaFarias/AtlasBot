import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

/**
 * Proxy (Next.js 16 — sucessor do middleware.ts, runtime nodejs).
 * Protege as páginas admin e as APIs administrativas com o cookie de sessão.
 * Rotas públicas (fora do matcher): /, /widget, /api/chat, /api/feedback,
 * /api/auth/* e /widget.js — o widget precisa continuar embeddável.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuthenticated = await verifySessionToken(token);

  if (isAuthenticated) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // APIs respondem 401 JSON; páginas redirecionam para o login
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/knowledge/:path*',
    '/settings/:path*',
    '/api/documents/:path*',
    '/api/analytics/:path*',
    '/api/settings/:path*',
  ],
};
