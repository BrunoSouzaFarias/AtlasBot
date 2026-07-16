import mammoth from 'mammoth';
import { createRequire } from 'module';

export interface ParsedDocument {
  content: string;
  metadata: {
    pageCount?: number;
    title?: string;
  };
}

export async function parseDocument(
  buffer: Buffer,
  fileType: string
): Promise<ParsedDocument> {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return parsePdf(buffer);
    case 'docx':
      return parseDocx(buffer);
    case 'txt':
    case 'md':
      return parsePlainText(buffer);
    default:
      throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
  }
}

async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const require = createRequire(import.meta.url);
  const pdf = require('pdf-parse');
  const data = await pdf(buffer);
  return {
    content: data.text || '',
    metadata: {
      pageCount: data.numpages,
      title: data.info?.Title || undefined,
    },
  };
}

async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  return {
    content: result.value,
    metadata: {},
  };
}

function parsePlainText(buffer: Buffer): ParsedDocument {
  return {
    content: buffer.toString('utf-8'),
    metadata: {},
  };
}
