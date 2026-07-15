import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limit: máx 5 uploads por minuto por IP
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`upload:${ip}`, 5, 60_000);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // 3. Validações de arquivo
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return Response.json(
        { error: 'Tipo de arquivo inválido. Apenas PNG, JPEG e WEBP são permitidos.' },
        { status: 400 }
      );
    }

    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_SIZE) {
      return Response.json(
        { error: 'Tamanho do arquivo excede o limite de 4MB.' },
        { status: 413 }
      );
    }

    // 4. Salvar arquivo localmente
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Gerar nome único aleatório
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${uniqueName}`;

    return Response.json({ url: relativeUrl });
  } catch (error) {
    console.error('Attachment upload error:', error);
    return Response.json({ error: 'Erro ao processar o upload' }, { status: 500 });
  }
}
