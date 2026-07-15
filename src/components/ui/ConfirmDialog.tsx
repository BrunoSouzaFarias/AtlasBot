'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // <dialog>.showModal() dá focus trap e Esc de graça
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      onCancel={onCancel}
      aria-labelledby="confirm-dialog-title"
      className="m-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-slate-100 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        {danger && (
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-400" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h2 id="confirm-dialog-title" className="font-semibold text-white">
            {title}
          </h2>
          {description && <p className="text-sm text-slate-400 mt-1.5">{description}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
