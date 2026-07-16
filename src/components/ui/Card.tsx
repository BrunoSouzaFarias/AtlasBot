import React from 'react';

export function Card({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-6 shadow-sm ${className}`}>
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
      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {description && <p className="text-slate-500 text-xs mt-1">{description}</p>}
    </div>
  );
}
