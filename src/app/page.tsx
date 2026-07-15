'use client';

import React, { useEffect } from 'react';
import { 
  Bot, 
  ArrowRight, 
  Database, 
  BarChart3, 
  Settings2,
  CheckCircle,
  HelpCircle,
  Code
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  // Inject widget dynamically for real-time demo
  useEffect(() => {
    // Check if script is already present
    const existingScript = document.querySelector('script[src*="widget.js"]');
    if (!existingScript) {
      (window as any).LIBERTYBOT_SETTINGS = {
        welcomeMessage: 'Olá! Sou o assistente de demonstração da Liberty TI. Como posso ajudar você hoje?',
        primaryColor: '#06b6d4'
      };
      
      const script = document.createElement('script');
      script.src = '/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-wide text-white">Liberty TI</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-sm font-semibold transition-all duration-200"
          >
            Entrar no Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col items-center text-center justify-center relative z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-semibold text-cyan-400 mb-6 animate-pulse">
          <Bot className="w-3.5 h-3.5" />
          LibertyBot v1.0 MVP
        </span>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-3xl">
          Automatize o Suporte N1 da <br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Liberty TI com Inteligência Artificial
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl mt-6 max-w-2xl leading-relaxed">
          Transforme toda a base de conhecimento e procedimentos de TI da sua empresa em um assistente de conversação rápido, inteligente e sempre disponível.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Acessar Dashboard
          </Link>
          <Link
            href="/knowledge"
            className="px-6 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-slate-300 hover:text-white transition-all"
          >
            Carregar Wiki
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          {/* Card 1 */}
          <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl backdrop-blur-sm hover:border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ingestão de Wiki</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Faça upload de manuais em PDF, DOCX, TXT ou Markdown e treine a IA sem complicação em poucos segundos.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl backdrop-blur-sm hover:border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Analytics de Gaps</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Monitore o que o bot não conseguiu responder para atualizar a documentação interna do suporte N1 da Liberty TI.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl backdrop-blur-sm hover:border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20 mb-4">
              <Settings2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Fácil Customização</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Personalize a cor da marca, mensagem inicial e copie o código para embutir no portal do cliente com uma linha de código.
            </p>
          </div>
        </div>

        {/* Demo / Dogfooding Info banner */}
        <div className="mt-16 p-4 bg-slate-900/30 border border-slate-800/80 rounded-2xl max-w-2xl flex items-center gap-3 text-left">
          <HelpCircle className="w-8 h-8 text-cyan-400 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Dica de Teste:</strong> O widget de chat ativo no canto inferior direito está rodando o script real do bot. Teste enviando mensagens! Você pode gerenciar os documentos do bot clicando em "Carregar Wiki".
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 z-10 bg-slate-950">
        <p>© 2026 Liberty TI. Todos os direitos reservados. Feito com ❤️ para o time de Operações N1.</p>
      </footer>
    </div>
  );
}
