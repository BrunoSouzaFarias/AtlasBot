'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  chunks: number;
  status: 'processing' | 'ready' | 'error';
  createdAt: string;
}

/**
 * Lista de documentos com polling enquanto houver algum "processing".
 * O intervalo é criado UMA vez; o tick lê o estado atual via ref
 * (evita o bug de recriar o setInterval a cada mudança de estado).
 */
export function useDocumentsPolling(intervalMs = 5000) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const documentsRef = useRef<KnowledgeDocument[]>([]);

  // Ref sincronizada em effect (acessar ref durante render viola regra do compiler)
  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDocuments(data.documents);
      setError(null);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Não foi possível carregar os documentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Primeiro fetch em microtask: os setState acontecem após await (async)
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchDocuments();
    })();

    const interval = setInterval(() => {
      if (documentsRef.current.some(doc => doc.status === 'processing')) {
        fetchDocuments();
      }
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchDocuments, intervalMs]);

  return { documents, setDocuments, loading, error, refresh: fetchDocuments };
}
