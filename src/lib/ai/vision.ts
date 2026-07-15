import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analisa uma imagem local (public/uploads/...) usando o modelo de visão da NVIDIA
 * e retorna uma descrição detalhada de qualquer texto, erro ou elemento visual encontrado.
 */
export async function analyzeScreenshot(relativeUrl: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'public', relativeUrl);
    
    // Fallback de segurança se o arquivo não existir localmente (ex. em produção)
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found locally: ${filePath}`);
      return '';
    }

    const imageBuffer = await fs.promises.readFile(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    let mimeType = 'image/png';
    if (relativeUrl.endsWith('.jpg') || relativeUrl.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (relativeUrl.endsWith('.webp')) {
      mimeType = 'image/webp';
    }

    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const { text } = await generateText({
      model: nvidia.chat('nvidia/llama-3.2-11b-vision-instruct'), // Modelo visão na NVIDIA
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Descreva detalhadamente o que está nesta imagem. Foque em mensagens de erro, textos visíveis, logs de console, popups ou qualquer informação útil de suporte de TI. Retorne apenas a descrição detalhada do conteúdo da imagem.',
            },
            {
              type: 'image',
              image: dataUrl,
            },
          ],
        },
      ],
      temperature: 0.2,
    });

    return text.trim();
  } catch (err) {
    console.error('NVIDIA Vision analysis failed:', err);
    return 'Não foi possível extrair o conteúdo visual da imagem anexada devido a um erro de processamento de imagem.';
  }
}
