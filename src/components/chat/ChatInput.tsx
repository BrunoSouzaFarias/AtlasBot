'use client';

import React, { useState, useRef } from 'react';
import { Send, MessageSquare, Image, Loader2, X } from 'lucide-react';

export default function ChatInput({
  onSend,
  disabled,
  primaryColor,
}: {
  onSend: (text: string, attachmentUrl?: string) => void;
  disabled?: boolean;
  primaryColor: string;
}) {
  const [input, setInput] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setAttachmentUrl(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Erro no upload');
      }

      const data = await res.json();
      setAttachmentUrl(data.url);
    } catch (err: any) {
      alert(err.message || 'Falha ao fazer upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const item = e.clipboardData.items[0];
    if (item && item.type.indexOf('image') === 0) {
      const file = item.getAsFile();
      if (file) {
        uploadFile(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !attachmentUrl) || disabled || uploading) return;
    setInput('');
    setAttachmentUrl(null);
    onSend(text || 'Anexou imagem', attachmentUrl || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white shrink-0">
      {/* Preview Thumbnail */}
      {attachmentUrl && (
        <div className="flex items-center gap-2 mb-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg max-w-[200px] relative group select-none animate-fade-in">
          <img src={attachmentUrl} alt="Preview" className="w-10 h-10 object-cover rounded" />
          <span className="text-[10px] text-slate-500 truncate max-w-[110px] font-semibold">Imagem pronta</span>
          <button
            type="button"
            onClick={() => setAttachmentUrl(null)}
            className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-full hover:bg-rose-250 cursor-pointer transition-all"
            title="Remover anexo"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="p-2.5 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all cursor-pointer outline-none shrink-0"
          title="Anexar imagem (ou use Ctrl+V)"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Image className="w-4 h-4" />
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />

        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onPaste={handlePaste}
            disabled={disabled}
            maxLength={4000}
            aria-label="Digite sua mensagem"
            placeholder="Digite sua dúvida ou cole um print..."
            className="w-full bg-slate-50 border border-slate-250 hover:border-slate-350 focus:border-blue-500/80 rounded-xl pl-4 pr-12 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all disabled:opacity-50 focus:bg-white"
          />
          <button
            type="submit"
            disabled={(!input.trim() && !attachmentUrl) || disabled || uploading}
            aria-label="Enviar mensagem"
            className="absolute right-2 p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all cursor-pointer outline-none"
            style={(input.trim() || attachmentUrl) && !disabled ? { color: primaryColor } : {}}
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="text-[10px] text-center text-slate-400 mt-2 font-medium tracking-wide flex items-center justify-center gap-1 select-none">
        Powered by <MessageSquare className="w-3 h-3 text-blue-500/80" aria-hidden="true" /> Liberty TI
      </div>
    </form>
  );
}
