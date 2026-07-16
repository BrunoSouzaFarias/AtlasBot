'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, BarChart3, Database, Settings, LogOut, MessageSquare } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/dashboard/chats', label: 'Atendimentos', icon: MessageSquare },
  { href: '/knowledge', label: 'Base de Conhecimento', icon: Database },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

/**
 * Shell das páginas admin (Tema Claro): header com navegação compartilhada + logout.
 * `title`/`description`/`actions` compõem o cabeçalho da página.
 */
export default function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Barra de navegação global (Tema Claro) */}
      <nav
        aria-label="Navegação principal"
        className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Página inicial AtlasBot">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20 text-blue-600">
              <Bot className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-bold text-sm text-slate-900 hidden sm:inline">AtlasBot</span>
          </Link>

          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-blue-600/10 text-blue-600 border border-blue-500/20 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
            aria-label="Sair da conta admin"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </nav>

      {/* Cabeçalho da página */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {title}
            </h1>
            {description && <p className="text-slate-500 mt-1 text-sm">{description}</p>}
          </div>
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
