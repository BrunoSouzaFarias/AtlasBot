'use client';

import React, { useState } from 'react';
import {
  Trash2,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import UploadDropzone from '@/components/knowledge/UploadDropzone';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useDocumentsPolling } from '@/hooks/useDocumentsPolling';

const statusBadge = {
  processing: (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-medium rounded-full border border-cyan-500/20">
      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
      Processando
    </span>
  ),
  ready: (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
      Pronto
    </span>
  ),
  error: (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-xs font-medium rounded-full border border-rose-500/20">
      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
      Erro
    </span>
  ),
};

export default function KnowledgeBase() {
  const { toast } = useToast();
  const { documents, setDocuments, loading, error, refresh } = useDocumentsPolling();
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      if (res.ok) {
        toast('success', `${files.length} arquivo(s) enviado(s) com sucesso.`);
        await refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast('error', data?.error ?? 'Falha ao enviar arquivos.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast('error', 'Erro de conexão durante o envio.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== deleteTarget.id));
        toast('success', `"${deleteTarget.name}" removido da base de conhecimento.`);
      } else {
        toast('error', 'Falha ao deletar documento.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast('error', 'Erro de conexão ao deletar documento.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell
      title="Base de Conhecimento"
      description="Carregue manuais, procedimentos e scripts de suporte N1"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 gap-6">
        <UploadDropzone
          uploading={uploading}
          onUpload={handleUpload}
          onValidationError={msg => toast('error', msg)}
        />

        {/* Busca */}
        <div className="relative">
          <Search
            className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Pesquisar documentos"
            placeholder="Pesquisar documentos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition-all"
          />
        </div>

        {/* Lista */}
        <div className="bg-slate-900/35 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="font-semibold text-white">
              Documentos Indexados ({filteredDocuments.length})
            </h2>
          </div>

          {loading ? (
            <Spinner label="Buscando documentos..." className="p-12" />
          ) : error ? (
            <EmptyState
              icon={<XCircle className="w-12 h-12" />}
              title="Erro ao carregar documentos"
              description={error}
            />
          ) : filteredDocuments.length > 0 ? (
            <ul className="divide-y divide-slate-800/80">
              {filteredDocuments.map(doc => (
                <li
                  key={doc.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="p-2.5 bg-slate-950 text-slate-400 rounded-lg border border-slate-800 shrink-0"
                      aria-hidden="true"
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-white truncate pr-4">{doc.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="uppercase">{doc.type}</span>
                        <span aria-hidden="true">•</span>
                        <span>{doc.chunks} partes</span>
                        <span aria-hidden="true">•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {statusBadge[doc.status]}
                    <button
                      onClick={() => setDeleteTarget({ id: doc.id, name: doc.name })}
                      aria-label={`Deletar documento ${doc.name}`}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<FileText className="w-12 h-12" />}
              title="Nenhum documento encontrado"
              description="Carregue arquivos para treinar a IA do LibertyBot."
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Deletar documento?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" será removido da base de conhecimento e o bot deixará de usá-lo nas respostas.`
            : undefined
        }
        confirmLabel="Deletar"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
