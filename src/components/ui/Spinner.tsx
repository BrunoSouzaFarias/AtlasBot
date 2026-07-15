import { Loader2 } from 'lucide-react';

export default function Spinner({
  label = 'Carregando...',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 text-slate-500 ${className}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" aria-hidden="true" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
