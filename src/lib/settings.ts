import prisma from '@/lib/db/prisma';

export interface AppSettings {
  model: string;
  temperature: number;
  welcomeMessage: string;
  primaryColor: string;
  systemPromptExtra: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  model: process.env.LLM_MODEL || 'deepseek-ai/deepseek-v4-flash',
  temperature: 0.3,
  welcomeMessage: 'Olá! Como posso ajudar você hoje no suporte da Liberty TI?',
  primaryColor: '#06b6d4',
  systemPromptExtra: '',
};

/** Modelos NVIDIA permitidos no seletor (allowlist do PUT /api/settings). */
export const ALLOWED_MODELS = [
  'deepseek-ai/deepseek-v4-flash',
  'deepseek-ai/deepseek-v4-pro',
] as const;

// Cache in-memory com TTL: em serverless cada instância re-lê no máx. a cada 60s
let cache: { value: AppSettings; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

export async function getSettings(): Promise<AppSettings> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  try {
    const rows = await prisma.setting.findMany();
    const map = new Map(rows.map(r => [r.key, r.value]));

    const parsedTemp = parseFloat(map.get('temperature') ?? '');
    const settings: AppSettings = {
      model: map.get('model') || DEFAULT_SETTINGS.model,
      temperature: Number.isFinite(parsedTemp) ? parsedTemp : DEFAULT_SETTINGS.temperature,
      welcomeMessage: map.get('welcomeMessage') || DEFAULT_SETTINGS.welcomeMessage,
      primaryColor: map.get('primaryColor') || DEFAULT_SETTINGS.primaryColor,
      systemPromptExtra: map.get('systemPromptExtra') ?? DEFAULT_SETTINGS.systemPromptExtra,
    };

    cache = { value: settings, expiresAt: Date.now() + CACHE_TTL_MS };
    return settings;
  } catch (err) {
    // Banco indisponível não pode derrubar o chat — usa defaults
    console.error('Failed to load settings, using defaults:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<void> {
  const entries = Object.entries(partial).filter(([, v]) => v !== undefined);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    )
  );
  cache = null; // invalida o cache desta instância imediatamente
}
