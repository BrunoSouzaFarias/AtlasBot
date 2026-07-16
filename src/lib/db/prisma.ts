import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

const databaseUrl = (process.env.DATABASE_URL || '').replace(/\s/g, '');
const tursoAuthToken = (process.env.TURSO_AUTH_TOKEN || '').replace(/\s/g, '');

if (
  databaseUrl.startsWith('libsql://') ||
  databaseUrl.startsWith('https://') ||
  databaseUrl.startsWith('http://')
) {
  // Conexão remota do Turso utilizando o Driver Adapter LibSQL para ambientes serverless
  const client = createClient({
    url: databaseUrl,
    ...(tursoAuthToken ? { authToken: tursoAuthToken } : {}),
  });
  const adapter = new PrismaLibSQL(client);
  prismaInstance = new PrismaClient({ adapter });
} else {
  // Fallback local utilizando arquivo SQLite (desenvolvimento)
  prismaInstance = new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
