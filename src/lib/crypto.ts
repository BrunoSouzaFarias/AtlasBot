import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || 'default-secret-key-must-be-32-chars-long!').replace(/\s/g, '');

/**
 * Criptografa uma string usando AES-256-GCM.
 * Retorna o resultado no formato `iv:authTag:encryptedHex`.
 */
export function encrypt(text: string | null | undefined): string | null {
  if (text === null || text === undefined) return null;
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Garante uma chave de exatamente 32 bytes gerando um hash SHA-256 do segredo
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  
  const iv = crypto.randomBytes(12); // IV recomendado para GCM é de 12 bytes
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(trimmed, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Descriptografa uma string formatada como `iv:authTag:encryptedHex`.
 * Se a string não estiver no formato esperado, retorna-a como texto original (compatibilidade).
 */
export function decrypt(encryptedText: string | null | undefined): string | null {
  if (encryptedText === null || encryptedText === undefined) return null;
  if (!encryptedText) return '';

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    // Caso não contenha os delimitadores, assume-se que é um registro antigo não criptografado
    return encryptedText;
  }

  const [ivHex, authTagHex, encrypted] = parts;

  try {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt data (check ENCRYPTION_KEY):', err);
    // Retorna um marcador amigável em caso de quebra ou chave inválida
    return '[DADO_INCOMPATIVEL]';
  }
}
