import React from 'react';

type Accent = 'cyan' | 'blue' | 'emerald' | 'violet' | 'amber' | 'rose';

const accentClasses: Record<Accent, { glow: string; icon: string }> = {
  cyan: { glow: 'bg-cyan-500/5 group-hover:bg-cyan-500/10', icon: 'bg-cyan-950/50 text-cyan-400 border-cyan-800/30' },
  blue: { glow: 'bg-blue-500/5 group-hover:bg-blue-500/10', icon: 'bg-blue-950/50 text-blue-400 border-blue-800/30' },
  emerald: { glow: 'bg-emerald-500/5 group-hover:bg-emerald-500/10', icon: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/30' },
  violet: { glow: 'bg-violet-500/5 group-hover:bg-violet-500/10', icon: 'bg-violet-950/50 text-violet-400 border-violet-800/30' },
  amber: { glow: 'bg-amber-500/5 group-hover:bg-amber-500/10', icon: 'bg-amber-950/50 text-amber-400 border-amber-800/30' },
  rose: { glow: 'bg-rose-500/5 group-hover:bg-rose-500/10', icon: 'bg-rose-950/50 text-rose-400 border-rose-800/30' },
};

export default function StatCard({
  label,
  value,
  icon,
  accent = 'cyan',
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: Accent;
  hint?: string;
}) {
  const c = accentClasses[accent];
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl transition-all ${c.glow}`}></div>
      <div className="flex justify-between items-start mb-4">
        <span className={`p-3 rounded-lg border ${c.icon}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <span className="text-slate-400 text-sm font-medium">{label}</span>
      <h3 className="text-3xl font-bold mt-1 text-white">{value}</h3>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}
