import { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const payload = await verifySessionToken(token);

    if (!payload) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Busca dados do usuário para exibição no painel
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    console.error('Auth Me API error:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
