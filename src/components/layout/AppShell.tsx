'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, BarChart3, Database, Settings, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/knowledge', label: 'Base de Conhecimento', icon: Database },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

/**
 * Shell das páginas admin: header com navegação compartilhada + logout.
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Barra de navegação global */}
      <nav
        aria-label="Navegação principal"
        className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Página inicial LibertyBot">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <Bot className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-bold text-sm text-white hidden sm:inline">LibertyBot</span>
          </Link>

          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-all cursor-pointer shrink-0"
            aria-label="Sair da conta admin"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </nav>

      {/* Cabeçalho da página */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {title}
            </h1>
            {description && <p className="text-slate-400 mt-1">{description}</p>}
          </div>
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
