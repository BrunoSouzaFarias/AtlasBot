'use client';

import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Renderiza markdown das respostas do bot com sanitização (DOMPurify)
 * contra XSS — o conteúdo do LLM pode ecoar HTML vindo de documentos.
 * Estilos em .chat-markdown (globals.css).
 */
export default function Markdown({ content }: { content: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(content, { async: false, breaks: true });
    return DOMPurify.sanitize(raw, {
      FORBID_TAGS: ['style', 'form', 'input', 'iframe'],
      FORBID_ATTR: ['style'],
    });
  }, [content]);

  return (
    <div
      className="chat-markdown select-text"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
