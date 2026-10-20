import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Always retain global singleton across hot reloads and worker threads to prevent connection pool exhaustion on Neon
globalThis.prismaGlobal = prisma;

export * from '@prisma/client';
