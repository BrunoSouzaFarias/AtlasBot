'use client';

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DayPoint {
  date: string; // yyyy-MM-dd
  count: number;
}

/** Gráfico de barras leve (divs com altura %) — sem lib de charts. */
export default function BarChart({ data, label }: { data: DayPoint[]; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <figure
      role="img"
      aria-label={`${label}: ${total} no período. ${data
        .map(d => `${format(parseISO(d.date), 'd/MM')}: ${d.count}`)
        .join(', ')}`}
    >
      <div className="flex items-end gap-1.5 h-36" aria-hidden="true">
        {data.map(d => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
            <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
              {d.count}
            </span>
            <div
              className="w-full rounded-t bg-gradient-to-t from-cyan-600/70 to-cyan-400/90 group-hover:from-cyan-500 group-hover:to-cyan-300 transition-all min-h-[2px]"
              style={{ height: `${Math.max((d.count / max) * 100, 2)}%` }}
              title={`${format(parseISO(d.date), "d 'de' MMMM", { locale: ptBR })}: ${d.count} mensagens`}
            ></div>
            <span className="text-[9px] text-slate-600 truncate w-full text-center">
              {format(parseISO(d.date), 'd/M')}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}
