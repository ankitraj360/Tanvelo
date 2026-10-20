import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const isTest = process.env.NODE_ENV === 'test';
const testDbUrl = process.env.TEST_DATABASE_URL;
const prodDbUrl = process.env.DATABASE_URL;

if (isTest && testDbUrl && prodDbUrl && testDbUrl === prodDbUrl && process.env.ALLOW_SHARED_TEST_DB !== 'true') {
  console.warn('WARNING: TEST_DATABASE_URL matches DATABASE_URL. Running in shared database mode with strict project-level isolation.');
}

const activeDbUrl = (isTest && testDbUrl) ? testDbUrl : undefined;

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: activeDbUrl ? { db: { url: activeDbUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Always retain global singleton across hot reloads and worker threads to prevent connection pool exhaustion on Neon
globalThis.prismaGlobal = prisma;

export * from '@prisma/client';
