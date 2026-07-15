'use client';

import React, { useEffect, useState } from 'react';
import {
  Bot,
  Palette,
  Code,
  Copy,
  Check,
  Save,
  MessageSquareCode,
} from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [model, setModel] = useState('deepseek-ai/deepseek-v4-flash');
  const [temperature, setTemperature] = useState(0.3);
  const [welcomeMessage, setWelcomeMessage] = useState(
    'Olá! Como posso ajudar você hoje no suporte da Liberty TI?'
  );
  const [primaryColor, setPrimaryColor] = useState('#06b6d4');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Em microtask para não fazer setState síncrono no effect (regra do compiler).
    // A Fase 3 troca localStorage por GET /api/settings.
    queueMicrotask(() => {
      const savedModel = localStorage.getItem('libertybot_model');
      const savedTemp = localStorage.getItem('libertybot_temperature');
      const savedMsg = localStorage.getItem('libertybot_welcome');
      const savedColor = localStorage.getItem('libertybot_color');

      if (savedModel) setModel(savedModel);
      if (savedTemp) setTemperature(parseFloat(savedTemp));
      if (savedMsg) setWelcomeMessage(savedMsg);
      if (savedColor) setPrimaryColor(savedColor);
    });
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem('libertybot_model', model);
    localStorage.setItem('libertybot_temperature', temperature.toString());
    localStorage.setItem('libertybot_welcome', welcomeMessage);
    localStorage.setItem('libertybot_color', primaryColor);
    setSaving(false);
    toast('success', 'Configurações salvas com sucesso!');
  };

  const embedCode = `<!-- LibertyBot Chat Widget -->
<script>
  window.LIBERTYBOT_SETTINGS = {
    welcomeMessage: "${welcomeMessage}",
    primaryColor: "${primaryColor}"
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/widget.js" async></script>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast('success', 'Código de integração copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell
      title="Configurações"
      description="Personalize o comportamento e a aparência do LibertyBot"
      actions={
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" aria-hidden="true" />
          Salvar Alterações
        </Button>
      }
    >
      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* IA */}
          <Card>
            <CardHeader
              icon={<Bot className="w-5 h-5 text-cyan-400" aria-hidden="true" />}
              title="Motor de Inteligência Artificial"
            />
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="llm-model"
                  className="block text-sm font-medium text-slate-400 mb-1.5"
                >
                  Modelo de Linguagem (LLM)
                </label>
                <select
                  id="llm-model"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-slate-100 outline-none transition-all"
                >
                  <option value="deepseek-ai/deepseek-v4-flash">
                    DeepSeek V4 Flash (Recomendado — rápido)
                  </option>
                  <option value="deepseek-ai/deepseek-v4-pro">
                    DeepSeek V4 Pro (mais lento, pode enfileirar)
                  </option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="llm-temperature"
                  className="block text-sm font-medium text-slate-400 mb-1.5"
                >
                  Temperatura (Criatividade vs Precisão): {temperature}
                </label>
                <input
                  id="llm-temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1" aria-hidden="true">
                  <span>Mais Preciso (0.0)</span>
                  <span>Mais Criativo (1.0)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Aparência */}
          <Card>
            <CardHeader
              icon={<Palette className="w-5 h-5 text-cyan-400" aria-hidden="true" />}
              title="Aparência & Widget"
            />
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="welcome-message"
                  className="block text-sm font-medium text-slate-400 mb-1.5"
                >
                  Mensagem de Boas-Vindas
                </label>
                <textarea
                  id="welcome-message"
                  rows={3}
                  value={welcomeMessage}
                  onChange={e => setWelcomeMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-slate-100 outline-none transition-all resize-none"
                />
              </div>
              <div>
                <label
                  htmlFor="primary-color"
                  className="block text-sm font-medium text-slate-400 mb-1.5"
                >
                  Cor Principal da Interface
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 border border-slate-800 rounded-lg cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    aria-label="Cor principal em hexadecimal"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-lg p-2 px-3 text-sm text-slate-100 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              icon={<Code className="w-5 h-5 text-cyan-400" aria-hidden="true" />}
              title="Código de Integração"
              description="Copie e cole este código antes da tag </body> no seu portal do cliente ou sistema web."
            />
            <div className="relative mt-2">
              <pre className="bg-slate-950 border border-slate-900 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {embedCode}
              </pre>
              <button
                onClick={copyEmbedCode}
                aria-label="Copiar código de integração"
                className="absolute top-2 right-2 p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md text-slate-400 hover:text-white transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </Card>

          <Card className="flex flex-col items-center text-center gap-3">
            <MessageSquareCode className="w-10 h-10 text-cyan-500" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-white text-sm">Testar Chat Widget</h3>
              <p className="text-xs text-slate-500 mt-1">
                Quer ver como o chatbot fica rodando no site?
              </p>
            </div>
            <Link
              href="/widget"
              target="_blank"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            >
              Abrir Playground
            </Link>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
