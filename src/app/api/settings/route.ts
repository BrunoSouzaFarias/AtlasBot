import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getSettings, saveSettings } from '@/lib/settings';
import { settingsSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const settings = await getSettings();
    return Response.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return Response.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      );
    }

    await saveSettings(parsed.data);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return Response.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
