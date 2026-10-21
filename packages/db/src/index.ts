import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
const testDbUrl = process.env.TEST_DATABASE_URL;
const prodDbUrl = process.env.DATABASE_URL;

if (isTest) {
  const resolvedUrl = testDbUrl || prodDbUrl;
  if (resolvedUrl && resolvedUrl === prodDbUrl && process.env.ALLOW_SHARED_TEST_DB !== 'true') {
    throw new Error(
      'SECURITY GUARD: Refusing to run test suite against production DATABASE_URL. Provide a dedicated TEST_DATABASE_URL or explicitly run with ALLOW_SHARED_TEST_DB=true.'
    );
  }
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
