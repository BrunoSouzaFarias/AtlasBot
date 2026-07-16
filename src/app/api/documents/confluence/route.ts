import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { ingestRawText } from '@/lib/documents/ingest';

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const spaceKey = body?.spaceKey?.trim().toUpperCase();

    if (!spaceKey) {
      return Response.json(
        { error: 'Chave do espaço (spaceKey) é obrigatória' },
        { status: 400 }
      );
    }

    const domain = process.env.CONFLUENCE_DOMAIN;
    const email = process.env.CONFLUENCE_EMAIL;
    const token = process.env.CONFLUENCE_API_TOKEN;

    if (!domain || !email || !token) {
      return Response.json(
        { error: 'Credenciais do Confluence não configuradas nas variáveis de ambiente (.env).' },
        { status: 400 }
      );
    }

    // Limpar o domínio para evitar protocolos duplicados
    const cleanDomain = domain.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');
    const url = `https://${cleanDomain}/wiki/rest/api/content?spaceKey=${spaceKey}&expand=body.view`;

    const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: `Erro na API do Confluence (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const pages = data.results || [];

    if (pages.length === 0) {
      return Response.json({
        message: `Nenhuma página encontrada no espaço "${spaceKey}".`,
        results: [],
      });
    }

    const results = [];
    for (const page of pages) {
      const title = page.title;
      const htmlContent = page.body?.view?.value || '';
      
      // Limpa tags HTML para texto puro
      const textContent = htmlContent
        .replace(/<\/p>|<\/h[1-6]>|<\/div>|<\/li>/gi, '\n') // Adiciona quebras de linha em tags de bloco
        .replace(/<[^>]*>/g, ' ')                          // Remove todas as tags HTML
        .replace(/&nbsp;/gi, ' ')                           // Substitui espaços HTML
        .replace(/\n\s*\n/g, '\n\n')                        // Remove quebras excessivas
        .replace(/ +/g, ' ')                                // Remove espaços duplos
        .trim();

      const documentName = `Confluence [${spaceKey}] - ${title}`;
      
      // Ingerir no banco e vetorizar
      const ingestResult = await ingestRawText(documentName, textContent, 'confluence');
      results.push({
        title,
        status: ingestResult.status,
        chunksCreated: ingestResult.chunksCreated,
        error: ingestResult.error,
      });
    }

    return Response.json({
      message: `Sincronização concluída para o espaço "${spaceKey}".`,
      results,
    });
  } catch (error) {
    console.error('Confluence sync error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
