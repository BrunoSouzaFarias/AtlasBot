import React from 'react';

export function Card({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-slate-900/35 border border-slate-800 rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {description && <p className="text-slate-400 text-xs mt-1">{description}</p>}
    </div>
  );
}
