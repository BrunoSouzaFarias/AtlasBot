export interface Chunk {
  content: string;
  index: number;
}

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', ' '],
};

export function chunkText(
  text: string,
  options: ChunkOptions = {}
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: Chunk[] = [];

  // Clean the text
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (cleanedText.length <= opts.chunkSize) {
    return [{ content: cleanedText, index: 0 }];
  }

  // Split by separators recursively
  const segments = splitBySeparators(cleanedText, opts.separators);

  let currentChunk = '';
  let chunkIndex = 0;

  for (const segment of segments) {
    if (currentChunk.length + segment.length > opts.chunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex++,
      });

      // Keep overlap
      const overlapStart = Math.max(0, currentChunk.length - opts.chunkOverlap);
      currentChunk = currentChunk.slice(overlapStart) + segment;
    } else {
      currentChunk += segment;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
    });
  }

  return chunks;
}

function splitBySeparators(text: string, separators: string[]): string[] {
  if (separators.length === 0) return [text];

  const separator = separators[0];
  const parts = text.split(separator);

  if (parts.length === 1) {
    // This separator didn't split, try next one
    return splitBySeparators(text, separators.slice(1));
  }

  // Re-add separator to maintain context
  return parts.map((part, i) =>
    i < parts.length - 1 ? part + separator : part
  );
}
