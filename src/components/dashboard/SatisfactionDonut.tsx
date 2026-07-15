'use client';

/** Donut SVG de satisfação (stroke-dasharray) — sem lib de charts. */
export default function SatisfactionDonut({
  positive,
  negative,
}: {
  positive: number;
  negative: number;
}) {
  const total = positive + negative;
  const rate = total > 0 ? Math.round((positive / total) * 100) : 0;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const filled = total > 0 ? (positive / total) * circumference : 0;

  return (
    <figure
      role="img"
      aria-label={`Taxa de satisfação: ${rate}% (${positive} positivos, ${negative} negativos)`}
      className="flex items-center gap-5"
    >
      <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden="true">
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="10"
        />
        {total > 0 && (
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="#34d399"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            transform="rotate(-90 55 55)"
          />
        )}
        <text
          x="55"
          y="52"
          textAnchor="middle"
          className="fill-white font-bold"
          fontSize="20"
        >
          {total > 0 ? `${rate}%` : '—'}
        </text>
        <text x="55" y="68" textAnchor="middle" className="fill-slate-500" fontSize="9">
          satisfação
        </text>
      </svg>
      <div className="space-y-2 text-xs" aria-hidden="true">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-slate-300 tabular-nums">{positive} positivos</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <span className="text-slate-300 tabular-nums">{negative} negativos</span>
        </div>
        {total === 0 && <p className="text-slate-500">Sem avaliações ainda</p>}
      </div>
    </figure>
  );
}
