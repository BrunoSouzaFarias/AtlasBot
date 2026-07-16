'use client';

import React, { useEffect } from 'react';
import {
  Bot,
  ArrowRight,
  Database,
  BarChart3,
  Settings2,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  // Injeta o widget dinamicamente para demonstração em tempo real
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="widget.js"]');
    if (!existingScript) {
      (window as unknown as { LIBERTYBOT_SETTINGS: object }).LIBERTYBOT_SETTINGS = {
        welcomeMessage: 'Olá! Sou o assistente de demonstração da Liberty TI. Como posso ajudar você hoje?',
        primaryColor: '#004e92' // Azul Liberty Health
      };
      
      const script = document.createElement('script');
      script.src = '/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Background Gradients (Tons de Azul Liberty suave no fundo claro) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-100/30 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20 text-blue-600">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-wide text-slate-900">Liberty TI</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-500/40 rounded-lg text-sm font-semibold text-slate-700 transition-all duration-200"
          >
            Entrar no Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col items-center text-center justify-center relative z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-600 mb-6 animate-pulse select-none">
          <Bot className="w-3.5 h-3.5" />
          LibertyBot v1.0 MVP
        </span>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight max-w-3xl">
          Automatize o Suporte N1 da <br />
          <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Liberty TI com Inteligência Artificial
          </span>
        </h1>
        
        <p className="text-slate-650 text-lg md:text-xl mt-6 max-w-2xl leading-relaxed">
          Transforme toda a base de conhecimento e procedimentos de TI da sua empresa em um assistente de conversação rápido, inteligente e sempre disponível.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Acessar Dashboard
          </Link>
          <Link
            href="/knowledge"
            className="px-6 py-3 bg-white border border-slate-200 hover:border-slate-350 rounded-xl font-bold text-slate-700 hover:text-slate-900 transition-all"
          >
            Carregar Wiki
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          {/* Card 1 */}
          <div className="p-6 bg-white border border-slate-250/80 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Ingestão de Wiki</h3>
            <p className="text-slate-650 text-sm leading-relaxed">
              Faça upload de manuais em PDF, DOCX, TXT ou Markdown e treine a IA sem complicação em poucos segundos.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white border border-slate-250/80 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Analytics de Gaps</h3>
            <p className="text-slate-650 text-sm leading-relaxed">
              Monitore o que o bot não conseguiu responder para atualizar a documentação interna do suporte N1 da Liberty TI.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white border border-slate-250/80 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 mb-4">
              <Settings2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Fácil Customização</h3>
            <p className="text-slate-650 text-sm leading-relaxed">
              Personalize a cor da marca, mensagem inicial e copie o código para embutir no portal do cliente com uma linha de código.
            </p>
          </div>
        </div>

        {/* Demo / Dogfooding Info banner */}
        <div className="mt-16 p-4 bg-blue-50 border border-blue-100/80 rounded-2xl max-w-2xl flex items-center gap-3 text-left">
          <HelpCircle className="w-8 h-8 text-blue-600 shrink-0" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-900">Dica de Teste:</strong> O widget de chat ativo no canto inferior direito está rodando o script real do bot. Teste enviando mensagens! Você pode gerenciar os documentos do bot clicando em &quot;Carregar Wiki&quot;.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 z-10 bg-white">
        <p>© 2026 Liberty TI. Todos os direitos reservados. Feito com ❤️ para o time de Operações N1.</p>
      </footer>
    </div>
  );
}
