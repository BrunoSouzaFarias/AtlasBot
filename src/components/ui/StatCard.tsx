import React from 'react';

type Accent = 'cyan' | 'blue' | 'emerald' | 'violet' | 'amber' | 'rose';

const accentClasses: Record<Accent, { glow: string; icon: string }> = {
  cyan: { glow: 'bg-cyan-500/5 group-hover:bg-cyan-500/10', icon: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  blue: { glow: 'bg-blue-500/5 group-hover:bg-blue-500/10', icon: 'bg-blue-50 text-blue-600 border-blue-100' },
  emerald: { glow: 'bg-emerald-500/5 group-hover:bg-emerald-500/10', icon: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  violet: { glow: 'bg-violet-500/5 group-hover:bg-violet-500/10', icon: 'bg-violet-50 text-violet-600 border-violet-100' },
  amber: { glow: 'bg-amber-500/5 group-hover:bg-amber-500/10', icon: 'bg-amber-50 text-amber-600 border-amber-100' },
  rose: { glow: 'bg-rose-500/5 group-hover:bg-rose-500/10', icon: 'bg-rose-50 text-rose-600 border-rose-100' },
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
    <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden group hover:border-slate-300 shadow-sm transition-all">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl transition-all ${c.glow}`}></div>
      <div className="flex justify-between items-start mb-4">
        <span className={`p-3 rounded-lg border ${c.icon}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <span className="text-slate-500 text-sm font-medium">{label}</span>
      <h3 className="text-3xl font-extrabold mt-1 text-slate-900">{value}</h3>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
