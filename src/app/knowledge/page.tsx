'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowLeft,
  Search,
  Database
} from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  name: string;
  type: string;
  chunks: number;
  status: 'processing' | 'ready' | 'error';
  createdAt: string;
}

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // Poll documents status every 5 seconds if any is processing
    const interval = setInterval(() => {
      const hasProcessing = documents.some(doc => doc.status === 'processing');
      if (hasProcessing) {
        fetchDocuments();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [documents]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('files', e.target.files[i]);
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchDocuments();
      } else {
        alert('Falha ao enviar arquivos.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erro durante o envio.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente deletar este documento da sua base de conhecimento?')) return;

    try {
      const res = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDocuments(documents.filter(doc => doc.id !== id));
      } else {
        alert('Falha ao deletar documento.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Erro ao deletar documento.');
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation & Header */}
        <div className="mb-8 border-b border-slate-800 pb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Dashboard
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
                <Database className="w-8 h-8 text-cyan-400" />
                Base de Conhecimento
              </h1>
              <p className="text-slate-400 mt-1">Carregue manuais, procedimentos e scripts de suporte N1</p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 rounded-lg text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 transition-all duration-200 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Carregar Documentos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 gap-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar documentos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* List of Documents */}
          <div className="bg-slate-900/35 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <h2 className="font-semibold text-white">Documentos Indexados ({filteredDocuments.length})</h2>
            </div>
            
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                <p>Buscando documentos...</p>
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className="divide-y divide-slate-800/80">
                {filteredDocuments.map(doc => (
                  <div key={doc.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/20 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-slate-950 text-slate-400 rounded-lg border border-slate-800 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-white truncate pr-4">{doc.name}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                          <span className="uppercase">{doc.type}</span>
                          <span>•</span>
                          <span>{doc.chunks} partes</span>
                          <span>•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Status indicator */}
                      {doc.status === 'processing' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-medium rounded-full border border-cyan-500/20">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Processando
                        </span>
                      )}
                      {doc.status === 'ready' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pronto
                        </span>
                      )}
                      {doc.status === 'error' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-xs font-medium rounded-full border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          Erro
                        </span>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
                        title="Deletar documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <FileText className="w-12 h-12 text-slate-700" />
                <div>
                  <p className="font-medium text-slate-400">Nenhum documento encontrado</p>
                  <p className="text-sm text-slate-500 mt-1">Carregue arquivos para treinar a IA do LibertyBot.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
