import { OpenAIEmbeddings } from '@langchain/openai';

let embeddingsInstance: OpenAIEmbeddings | null = null;

export function getEmbeddings(): OpenAIEmbeddings {
  if (!embeddingsInstance) {
    embeddingsInstance = new OpenAIEmbeddings({
      modelName: 'nvidia/nv-embed-v1',
      openAIApiKey: process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: 'https://integrate.api.nvidia.com/v1',
      }
    });
  }
  return embeddingsInstance;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = getEmbeddings();
  return embeddings.embedQuery(text);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings = getEmbeddings();
  return embeddings.embedDocuments(texts);
}
