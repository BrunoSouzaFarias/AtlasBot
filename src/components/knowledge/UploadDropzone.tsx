'use client';

import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE, MAX_FILES, validateUploadFile } from '@/lib/validation';

/**
 * Área de upload com drag-and-drop + input file de fallback.
 * Valida no cliente (mesmas regras do servidor) antes de enviar.
 */
export default function UploadDropzone({
  uploading,
  onUpload,
  onValidationError,
}: {
  uploading: boolean;
  onUpload: (files: File[]) => void;
  onValidationError: (message: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    if (files.length > MAX_FILES) {
      onValidationError(`Envie no máximo ${MAX_FILES} arquivos por vez.`);
      return;
    }
    for (const file of files) {
      const error = validateUploadFile(file);
      if (error) {
        onValidationError(error);
        return;
      }
    }
    onUpload(files);
  };

  return (
    <div
      onDragOver={e => {
        e.preventDefault();
        if (!uploading) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        if (!uploading) handleFiles(e.dataTransfer.files);
      }}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
        dragOver
          ? 'border-cyan-500 bg-cyan-500/5'
          : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={e => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
        multiple
        accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
        className="hidden"
        aria-label="Selecionar arquivos para upload"
      />

      <div className="flex flex-col items-center gap-3">
        <div
          className={`p-3 rounded-xl border transition-all ${
            dragOver
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
          aria-hidden="true"
        >
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
        </div>
        <div>
          <p className="font-medium text-slate-300 text-sm">
            {uploading
              ? 'Enviando e processando documentos...'
              : 'Arraste arquivos aqui ou'}
          </p>
          {!uploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm underline underline-offset-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded"
            >
              selecione do computador
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {ALLOWED_EXTENSIONS.join(', ').toUpperCase()} • máx. {MAX_FILE_SIZE / 1024 / 1024} MB por
          arquivo • até {MAX_FILES} arquivos
        </p>
      </div>
    </div>
  );
}
