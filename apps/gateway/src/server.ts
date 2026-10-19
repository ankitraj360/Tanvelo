import path from 'path';
import dotenv from 'dotenv';

// Load root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { gatewayRoutes } from './routes/gateway.routes.js';
import { managementRoutes } from './routes/management.routes.js';
import { gatewayService } from './services/gateway.service.js';

export function isLoopbackHost(host: string): boolean {
  const norm = (host || '').trim().toLowerCase();
  return (
    norm === '127.0.0.1' ||
    norm === 'localhost' ||
    norm === '::1' ||
    norm === '0:0:0:0:0:0:0:1'
  );
}

export function validateManagementSecurity(
  host: string,
  secret?: string,
  isProd = process.env.NODE_ENV === 'production'
): { safeHost: string; warning?: string } {
  const isLoopback = isLoopbackHost(host);
  const hasSecret = Boolean(secret && secret.trim().length >= 8);

  if (!isLoopback) {
    if (!hasSecret) {
      if (isProd) {
        throw new Error(
          `FATAL SECURITY CONFIGURATION: MANAGEMENT_BIND_HOST '${host}' is a non-loopback network interface, but MANAGEMENT_API_SECRET is missing or under 8 characters. Refusing to start in production to prevent exposing management API unauthenticated.`
        );
      }
      return {
        safeHost: '127.0.0.1',
        warning: `SECURITY WARNING: MANAGEMENT_BIND_HOST '${host}' is non-loopback without a valid MANAGEMENT_API_SECRET (minimum 8 characters). Forcing bind to 127.0.0.1 in non-production.`,
      };
    }
  }

  return { safeHost: host };
}

export async function createServers() {
  const rawManagementHost = process.env.MANAGEMENT_BIND_HOST || '127.0.0.1';
  const managementSecret = process.env.MANAGEMENT_API_SECRET;
  const { safeHost, warning } = validateManagementSecurity(rawManagementHost, managementSecret);

  if (warning && process.env.NODE_ENV !== 'test') {
    console.warn(warning);
  }

  // 1. Public Gateway Engine (serves /v1/* and /health on public interface)
  const publicGateway = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : true,
    bodyLimit: 10 * 1024 * 1024,
  });

  await publicGateway.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await publicGateway.register(sensible);
  await publicGateway.register(gatewayRoutes);

  publicGateway.addHook('onClose', async () => {
    await gatewayService.close();
  });

  // Block any attempt to reach management routes on the public gateway
  publicGateway.all('/api/*', async (request, reply) => {
    return reply.status(403).send({
      error: {
        message: 'Management API is not exposed on the public gateway interface. Access via the private management listener.',
        type: 'access_denied',
        code: 'MANAGEMENT_PORT_RESTRICTED',
      },
    });
  });

  // 2. Private Management Server (isolated to safeHost / MANAGEMENT_BIND_HOST)
  const managementServer = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : true,
    bodyLimit: 10 * 1024 * 1024,
  });

  await managementServer.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Management-Secret', 'X-Tanvelo-Admin-Token'],
  });
  await managementServer.register(sensible);

  // Management API secret access control
  if (managementSecret) {
    managementServer.addHook('onRequest', async (request, reply) => {
      if (request.url.startsWith('/api') && request.method !== 'OPTIONS') {
        const headerSecret =
          request.headers['x-management-secret'] ||
          request.headers['x-tanvelo-admin-token'] ||
          (request.headers['authorization']?.startsWith('Bearer ')
            ? request.headers['authorization'].slice(7)
            : null);

        if (headerSecret !== managementSecret) {
          return reply.status(401).send({
            error: {
              message: 'Unauthorized: Invalid management secret provided.',
              type: 'management_auth_failed',
              code: 'UNAUTHORIZED_MANAGEMENT_ACCESS',
            },
          });
        }
      }
    });
  }

  await managementServer.register(managementRoutes);

  // Management server health endpoint
  managementServer.get('/health', async (request, reply) => {
    return reply.send({
      status: 'healthy',
      service: 'tanvelo-management-api',
      bindHost: safeHost,
      authEnforced: Boolean(managementSecret),
    });
  });

  return { publicGateway, managementServer, safeHost };
}

async function main() {
  const { publicGateway, managementServer, safeHost } = await createServers();

  const gatewayPort = parseInt(process.env.GATEWAY_PORT || '4000', 10);
  const gatewayHost = process.env.GATEWAY_HOST || '0.0.0.0';

  const managementPort = parseInt(process.env.MANAGEMENT_PORT || '4001', 10);

  try {
    await publicGateway.listen({ port: gatewayPort, host: gatewayHost });
    console.log(`🚀 Tanvelo LLM Gateway (Public) running on http://${gatewayHost}:${gatewayPort}`);
    console.log(`📡 Unified Endpoint: POST http://${gatewayHost}:${gatewayPort}/v1/chat/completions`);

    await managementServer.listen({ port: managementPort, host: safeHost });
    console.log(`🔒 Tanvelo Management API (Private) running on http://${safeHost}:${managementPort}/api/...`);
  } catch (err) {
    console.error('Failed to start servers:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  main();
}
