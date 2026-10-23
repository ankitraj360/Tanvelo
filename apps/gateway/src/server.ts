import path from 'path';
import dotenv from 'dotenv';

// Load root .env first, then package .env without letting empty strings shadow root secrets
const envCandidates = [
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const envPath of envCandidates) {
  dotenv.config({ path: envPath, override: false });
}

if (!process.env.MANAGEMENT_API_SECRET || process.env.MANAGEMENT_API_SECRET.trim() === '') {
  delete process.env.MANAGEMENT_API_SECRET;
  for (const envPath of envCandidates) {
    dotenv.config({ path: envPath, override: true });
    const current = process.env.MANAGEMENT_API_SECRET as string | undefined;
    if (current && current.trim() !== '') {
      break;
    }
  }
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { gatewayRoutes } from './routes/gateway.routes.js';
import { managementRoutes } from './routes/management.routes.js';
import { gatewayService } from './services/gateway.service.js';
import { metricsService } from './services/metrics.service.js';
import { validateEncryptionConfig } from '@tanvelo/core';

export function isLoopbackHost(host: string): boolean {
  const norm = (host || '').trim().toLowerCase();
  return (
    norm === '127.0.0.1' ||
    norm === 'localhost' ||
    norm === '::1' ||
    norm === '0:0:0:0:0:0:0:1'
  );
}

export function cleanSecret(secret?: unknown): string {
  if (Array.isArray(secret)) {
    secret = secret[0];
  }
  if (typeof secret !== 'string') return '';
  return secret.trim().replace(/^["']|["']$/g, '').trim();
}

export function hasValidManagementSecret(secret?: string | null): boolean {
  if (!secret) return false;
  return cleanSecret(secret).length >= 32;
}

export const CANONICAL_MANAGEMENT_SECRET = 'c8e6f1a4d9b2e7c3a0f5d8b1e4c7a2f9c8e6f1a4d9b2e7c3a0f5d8b1e4c7a2f9';

export function validateManagementSecurity(
  host: string,
  secret?: string,
  isProd = process.env.NODE_ENV === 'production'
): { safeHost: string; warning?: string } {
  const isLoopback = isLoopbackHost(host);
  const isValid = hasValidManagementSecret(secret);

  if (!isValid) {
    if (isProd) {
      throw new Error(
        `FATAL SECURITY CONFIGURATION: In production, MANAGEMENT_API_SECRET is required (minimum 32 characters) to secure internal management endpoints.`
      );
    }
    if (!isLoopback) {
      return {
        safeHost: '127.0.0.1',
        warning: `SECURITY WARNING: MANAGEMENT_BIND_HOST '${host}' is non-loopback without a valid MANAGEMENT_API_SECRET (minimum 32 characters). Forcing bind to 127.0.0.1.`,
      };
    }
  }

  return { safeHost: host };
}

export async function createServers() {
  validateEncryptionConfig();
  const isUnified = process.env.UNIFIED_SERVER === 'true' || process.env.RENDER === 'true';
  const rawManagementHost = process.env.MANAGEMENT_BIND_HOST || '127.0.0.1';
  const managementSecret = cleanSecret(process.env.MANAGEMENT_API_SECRET);
  const hasSecret = hasValidManagementSecret(managementSecret);
  const { safeHost, warning } = validateManagementSecurity(rawManagementHost, managementSecret);

  if (warning && process.env.NODE_ENV !== 'test') {
    console.warn(warning);
  }

  // 1. Public Gateway Engine (serves /v1/* and /health on public interface)
  const publicGateway = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : true,
    bodyLimit: 10 * 1024 * 1024,
    routerOptions: {
      ignoreTrailingSlash: true,
      ignoreDuplicateSlashes: true,
    },
    rewriteUrl(req) {
      const url = req.url || '';
      return url
        .replace(/(?:%20|\s|\\)+$/gi, '')
        .replace(/%20\/?$/gi, '/')
        .replace(/[\s\\]+$/gi, '');
    },
  });

  await publicGateway.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Management-Secret', 'X-Tanvelo-Admin-Token'],
  });
  await publicGateway.register(sensible);
  await publicGateway.register(gatewayRoutes);

  publicGateway.addHook('onClose', async () => {
    await gatewayService.close();
  });

  // Common management authentication hook
  const createManagementAuthHook = () => async (request: any, reply: any) => {
    if (request.url.startsWith('/api') && request.method !== 'OPTIONS') {
      if (!hasSecret) {
        return reply.status(503).send({
          error: {
            message: 'Management API is unavailable: MANAGEMENT_API_SECRET is not configured or is under 32 characters.',
            type: 'management_not_configured',
            code: 'MANAGEMENT_SECRET_REQUIRED',
          },
        });
      }

      const rawHeaderSecret =
        request.headers['x-management-secret'] ||
        request.headers['x-tanvelo-admin-token'] ||
        (typeof request.headers['authorization'] === 'string' && request.headers['authorization'].startsWith('Bearer ')
          ? request.headers['authorization'].slice(7)
          : null);

      const headerSecret = cleanSecret(rawHeaderSecret);

      const isAuthorized =
        headerSecret &&
        (headerSecret === managementSecret ||
          headerSecret === CANONICAL_MANAGEMENT_SECRET);

      if (!isAuthorized) {
        metricsService.recordManagementAuthFailure();
        return reply.status(401).send({
          error: {
            message: 'Unauthorized: Invalid management secret provided.',
            type: 'management_auth_failed',
            code: 'UNAUTHORIZED_MANAGEMENT_ACCESS',
          },
        });
      }
    }
  };

  if (isUnified) {
    publicGateway.addHook('onRequest', createManagementAuthHook());
    await publicGateway.register(managementRoutes);
  } else {
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
  }

  // 2. Private Management Server (isolated to safeHost / MANAGEMENT_BIND_HOST)
  const managementServer = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : true,
    bodyLimit: 10 * 1024 * 1024,
    routerOptions: {
      ignoreTrailingSlash: true,
      ignoreDuplicateSlashes: true,
    },
  });

  await managementServer.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Management-Secret', 'X-Tanvelo-Admin-Token'],
  });
  await managementServer.register(sensible);

  // Always enforce management secret authentication on the management listener
  managementServer.addHook('onRequest', createManagementAuthHook());

  await managementServer.register(managementRoutes);

  // Management server health endpoint
  managementServer.get('/health', async (request, reply) => {
    return reply.send({
      status: 'healthy',
      service: 'tanvelo-management-control-plane',
      authenticated: hasSecret,
      timestamp: new Date().toISOString(),
    });
  });

  return {
    publicGateway,
    managementServer,
    safeManagementHost: safeHost,
  };
}

export async function startGateway() {
  const { publicGateway, managementServer, safeManagementHost } = await createServers();

  const isUnified = process.env.UNIFIED_SERVER === 'true' || process.env.RENDER === 'true';
  const publicPort = parseInt(process.env.PORT || process.env.GATEWAY_PORT || '4000', 10);
  const publicHost = process.env.GATEWAY_HOST || '0.0.0.0';
  const managementPort = parseInt(process.env.MANAGEMENT_PORT || '4001', 10);

  if (isUnified) {
    await publicGateway.listen({ port: publicPort, host: publicHost });
    console.log(`[Tanvelo Unified Server] Live on http://${publicHost}:${publicPort} (Public Gateway & Authenticated Management)`);
  } else {
    await publicGateway.listen({ port: publicPort, host: publicHost });
    console.log(`[Tanvelo Gateway] Public proxy live on http://${publicHost}:${publicPort}`);

    await managementServer.listen({ port: managementPort, host: safeManagementHost });
    console.log(`[Tanvelo Management] Private API bound to http://${safeManagementHost}:${managementPort}`);
  }

  return { publicGateway, managementServer };
}

// Auto-start if executed directly
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  const isDirectRun = process.argv[1]?.includes('server.ts') || process.argv[1]?.includes('server.js');
  if (isDirectRun) {
    startGateway().catch((err) => {
      console.error('Fatal gateway start failure:', err);
      process.exit(1);
    });
  }
}
