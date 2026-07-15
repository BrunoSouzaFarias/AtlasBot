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
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();
    return {
      content: textResult.text,
      metadata: {
        pageCount: infoResult.total,
        title: infoResult.info?.Title || undefined,
      },
    };
  } finally {
    await parser.destroy();
  }
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
