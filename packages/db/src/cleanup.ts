import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CleanupResult {
  gatewayRequestsDeleted: number;
  webhookDeliveriesDeleted: number;
  configChangesDeleted: number;
  timestamp: string;
}

export async function pruneHistoricalRecords(options?: {
  requestRetentionDays?: number;
  webhookRetentionDays?: number;
  configChangeRetentionDays?: number;
}): Promise<CleanupResult> {
  const reqDays = options?.requestRetentionDays ?? 90;
  const webhookDays = options?.webhookRetentionDays ?? 30;
  const configDays = options?.configChangeRetentionDays ?? 180;

  const reqCutoff = new Date(Date.now() - reqDays * 24 * 60 * 60 * 1000);
  const webhookCutoff = new Date(Date.now() - webhookDays * 24 * 60 * 60 * 1000);
  const configCutoff = new Date(Date.now() - configDays * 24 * 60 * 60 * 1000);

  const [reqResult, webhookResult, configResult] = await prisma.$transaction([
    prisma.gatewayRequest.deleteMany({
      where: {
        createdAt: {
          lt: reqCutoff,
        },
      },
    }),
    prisma.webhookDelivery.deleteMany({
      where: {
        createdAt: {
          lt: webhookCutoff,
        },
      },
    }),
    prisma.configurationChange.deleteMany({
      where: {
        createdAt: {
          lt: configCutoff,
        },
      },
    }),
  ]);

  return {
    gatewayRequestsDeleted: reqResult.count,
    webhookDeliveriesDeleted: webhookResult.count,
    configChangesDeleted: configResult.count,
    timestamp: new Date().toISOString(),
  };
}

// Allow direct CLI invocation
if (typeof require !== 'undefined' && require.main === module) {
  pruneHistoricalRecords()
    .then((res) => {
      console.log('[Retention Pruning] Cleanup succeeded:', JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Retention Pruning] Cleanup failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
