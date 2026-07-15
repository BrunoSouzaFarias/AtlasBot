import React from 'react';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
      {icon && <div className="text-slate-700" aria-hidden="true">{icon}</div>}
      <div>
        <p className="font-medium text-slate-400">{title}</p>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
