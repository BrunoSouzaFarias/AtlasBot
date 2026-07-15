import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { searchSimilar } from './vectorstore';
import { buildRagPrompt, SYSTEM_PROMPT } from './prompts';
import prisma from '@/lib/db/prisma';
import { chunkText } from '@/lib/documents/chunker';
import { getSettings } from '@/lib/settings';

const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
});


export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RAGResult {
  stream: ReturnType<typeof streamText>;
  sources: Array<{ content: string; documentName: string; score: number }>;
}

async function localFallbackSearch(
  query: string,
  topK: number = 5
): Promise<Array<{ content: string; documentName: string; score: number }>> {
  try {
    const documents = await prisma.document.findMany({
      where: { status: 'ready' },
    });

    if (documents.length === 0) return [];

    // Clean and split the query into keywords
    const stopWords = new Set([
      'de', 'do', 'da', 'o', 'a', 'os', 'as', 'em', 'um', 'uma', 'para', 'com',
      'como', 'que', 'se', 'por', 'na', 'no', 'nas', 'nos', 'e', 'ou', 'eh', 'é',
      'ti', 'liberty'
    ]);
    const terms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 1 && !stopWords.has(term));

    if (terms.length === 0) return [];

    const matchedChunks: Array<{ content: string; documentName: string; score: number }> = [];

    for (const doc of documents) {
      const chunks = chunkText(doc.content, {
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      for (const chunk of chunks) {
        const chunkLower = chunk.content.toLowerCase();
        let matchCount = 0;

        for (const term of terms) {
          if (chunkLower.includes(term)) {
            matchCount++;
          }
        }

        if (matchCount > 0) {
          matchedChunks.push({
            content: chunk.content,
            documentName: doc.name,
            score: matchCount / terms.length,
          });
        }
      }
    }

    return matchedChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (err) {
    console.error('Local fallback search failed:', err);
    return [];
  }
}

export async function chat(
  question: string,
  chatHistory: ChatMessage[] = [],
  attachmentUrl?: string
): Promise<RAGResult> {
  // 1. Search for relevant context (with Qdrant and SQLite fallback)
  let sources: Array<{ content: string; documentName: string; score: number }> = [];
  try {
    sources = await searchSimilar(question, 5);
  } catch (err) {
    console.warn('Qdrant/Vector database search failed or offline. Falling back to local database keyword search.', err);
    sources = await localFallbackSearch(question, 5);
  }

  // 2. Build context from sources
  let context = sources.length > 0
    ? sources
        .map(s => `[Fonte: ${s.documentName}]\n${s.content}`)
        .join('\n\n---\n\n')
    : 'Nenhuma informação relevante encontrada na base de conhecimento.';

  // 3. Load settings and dynamic image analysis (if screenshot exists)
  const settings = await getSettings();
  
  if (attachmentUrl) {
    try {
      const { analyzeScreenshot } = await import('./vision');
      const imageDescription = await analyzeScreenshot(attachmentUrl);
      if (imageDescription) {
        context += `\n\n[CONTEÚDO EXTRAÍDO DA IMAGEM ANEXADA]:\n${imageDescription}`;
      }
    } catch (visionErr) {
      console.error('Vision analysis integration error:', visionErr);
    }
  }

  const systemPrompt = settings.systemPromptExtra
    ? `${SYSTEM_PROMPT}\n\n${settings.systemPromptExtra}`
    : SYSTEM_PROMPT;

  // 4. Stream the response — histórico como turnos reais (não string
  // concatenada): melhora a qualidade e reduz injection via histórico
  const stream = streamText({
    model: nvidia.chat(settings.model),
    system: systemPrompt,
    messages: [
      ...chatHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: buildRagPrompt(context, question) },
    ],
    temperature: settings.temperature,
  });

  return { stream, sources };
}
