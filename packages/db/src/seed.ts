import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial configuration (No mock data)...');

  // Check if project already exists
  const existingProject = await prisma.project.findFirst({
    where: { slug: 'default' },
  });

  if (!existingProject) {
    const project = await prisma.project.create({
      data: {
        name: 'Default Project',
        slug: 'default',
        description: 'Default LLM Gateway workspace',
        environments: {
          create: [
            { name: 'Production', slug: 'production' },
            { name: 'Staging', slug: 'staging' },
            { name: 'Development', slug: 'development' },
          ],
        },
      },
      include: {
        environments: true,
      },
    });

    console.log(`Created default project: ${project.name} (${project.id})`);

    // Create default model configurations with standard pricing per 1M tokens
    const defaultModels = [
      {
        modelId: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        inputPricePerMillion: 2.50,
        outputPricePerMillion: 10.00,
        contextWindow: 128000,
        supportsStreaming: true,
      },
      {
        modelId: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        inputPricePerMillion: 0.15,
        outputPricePerMillion: 0.60,
        contextWindow: 128000,
        supportsStreaming: true,
      },
      {
        modelId: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        inputPricePerMillion: 3.00,
        outputPricePerMillion: 15.00,
        contextWindow: 200000,
        supportsStreaming: true,
      },
      {
        modelId: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        inputPricePerMillion: 0.25,
        outputPricePerMillion: 1.25,
        contextWindow: 200000,
        supportsStreaming: true,
      },
      {
        modelId: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'gemini',
        inputPricePerMillion: 1.25,
        outputPricePerMillion: 5.00,
        contextWindow: 1000000,
        supportsStreaming: true,
      },
      {
        modelId: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'gemini',
        inputPricePerMillion: 0.075,
        outputPricePerMillion: 0.30,
        contextWindow: 1000000,
        supportsStreaming: true,
      },
    ];

    for (const m of defaultModels) {
      await prisma.modelConfig.create({
        data: {
          projectId: project.id,
          ...m,
        },
      });
    }

    // Initialize provider connections with "unconfigured" status
    const initialProviders = ['openai', 'anthropic', 'gemini'];
    for (const p of initialProviders) {
      await prisma.providerConnection.create({
        data: {
          projectId: project.id,
          provider: p,
          apiKeyEncrypted: '',
          apiKeyPreview: '',
          status: 'unconfigured',
        },
      });
    }

    // Create a default routing rule for the development & production environments
    const devEnv = project.environments.find((e) => e.slug === 'development');
    const prodEnv = project.environments.find((e) => e.slug === 'production');

    if (devEnv) {
      await prisma.routingRule.create({
        data: {
          projectId: project.id,
          environmentId: devEnv.id,
          modelPattern: '*',
          primaryProvider: 'openai',
          primaryModel: 'gpt-4o',
          secondaryProvider: 'anthropic',
          secondaryModel: 'claude-3-5-sonnet-20241022',
          fallbackOnTimeout: true,
          fallbackOnRateLimit: true,
          fallbackOnError: true,
          timeoutMs: 30000,
          maxRetries: 2,
        },
      });
    }

    if (prodEnv) {
      await prisma.routingRule.create({
        data: {
          projectId: project.id,
          environmentId: prodEnv.id,
          modelPattern: '*',
          primaryProvider: 'openai',
          primaryModel: 'gpt-4o',
          secondaryProvider: 'anthropic',
          secondaryModel: 'claude-3-5-sonnet-20241022',
          fallbackOnTimeout: true,
          fallbackOnRateLimit: true,
          fallbackOnError: true,
          timeoutMs: 30000,
          maxRetries: 2,
        },
      });
    }

    console.log('Seeding completed successfully.');
  } else {
    console.log('Database already initialized.');
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
