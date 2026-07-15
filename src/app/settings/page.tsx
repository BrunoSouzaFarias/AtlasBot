'use client';

import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  ArrowLeft, 
  Bot, 
  Palette, 
  Code,
  Copy,
  Check,
  Save,
  MessageSquareCode
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.3);
  const [welcomeMessage, setWelcomeMessage] = useState('Olá! Como posso ajudar você hoje no suporte da Liberty TI?');
  const [primaryColor, setPrimaryColor] = useState('#06b6d4'); // Cyan 500
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load config from localStorage on mount
    const savedModel = localStorage.getItem('libertybot_model');
    const savedTemp = localStorage.getItem('libertybot_temperature');
    const savedMsg = localStorage.getItem('libertybot_welcome');
    const savedColor = localStorage.getItem('libertybot_color');

    if (savedModel) setModel(savedModel);
    if (savedTemp) setTemperature(parseFloat(savedTemp));
    if (savedMsg) setWelcomeMessage(savedMsg);
    if (savedColor) setPrimaryColor(savedColor);
  }, []);

  const handleSave = () => {
    localStorage.setItem('libertybot_model', model);
    localStorage.setItem('libertybot_temperature', temperature.toString());
    localStorage.setItem('libertybot_welcome', welcomeMessage);
    localStorage.setItem('libertybot_color', primaryColor);
    alert('Configurações salvas com sucesso!');
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
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation & Header */}
        <div className="mb-8 border-b border-slate-800 pb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
              <Settings className="w-8 h-8 text-cyan-400" />
              Configurações
            </h1>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main settings options */}
          <div className="md:col-span-2 space-y-6">
            {/* IA Config */}
            <div className="bg-slate-900/35 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                Motor de Inteligência Artificial
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Modelo de Linguagem (LLM)</label>
                  <select
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-slate-100 outline-none transition-all"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Recomendado - Rápido e Barato)</option>
                    <option value="gpt-4o">GPT-4o (Alta Precisão - Raciocínio Avançado)</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Respostas Naturais)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Temperatura (Criatividade vs Precisão): {temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={e => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Mais Preciso (0.0)</span>
                    <span>Mais Criativo (1.0)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget Config */}
            <div className="bg-slate-900/35 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-cyan-400" />
                Aparência & Widget
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Mensagem de Boas-Vindas</label>
                  <textarea
                    rows={3}
                    value={welcomeMessage}
                    onChange={e => setWelcomeMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-slate-100 outline-none transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Cor Principal da Interface</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 border border-slate-800 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-lg p-2 px-3 text-sm text-slate-100 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Embed Script Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900/35 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                Código de Integração
              </h2>
              <p className="text-slate-400 text-xs mb-4">
                Copie e cole este código antes da tag <code className="text-cyan-400">&lt;/body&gt;</code> no seu portal do cliente ou sistema web.
              </p>
              <div className="relative mt-2">
                <pre className="bg-slate-950 border border-slate-900 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {embedCode}
                </pre>
                <button
                  onClick={copyEmbedCode}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Copiar código"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-900/35 border border-slate-800 rounded-xl p-6 flex flex-col items-center text-center gap-3">
              <MessageSquareCode className="w-10 h-10 text-cyan-500" />
              <div>
                <h3 className="font-semibold text-white text-sm">Testar Chat Widget</h3>
                <p className="text-xs text-slate-500 mt-1">Quer ver como o chatbot fica rodando no site?</p>
              </div>
              <Link
                href="/widget"
                target="_blank"
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all"
              >
                Abrir Playground
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
