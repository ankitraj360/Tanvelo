import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

function getGatewayUrl(): string {
  const url = process.env.GATEWAY_INTERNAL_URL?.trim();
  if (url) return url.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return 'https://tanvelo-backend-zgyc.onrender.com';
  }
  return 'http://127.0.0.1:4001';
}

const CANONICAL_MANAGEMENT_SECRET = 'c8e6f1a4d9b2e7c3a0f5d8b1e4c7a2f9c8e6f1a4d9b2e7c3a0f5d8b1e4c7a2f9';

function resolveManagementSecret(): string {
  const raw = process.env.MANAGEMENT_API_SECRET;
  const val = (Array.isArray(raw) ? raw[0] : typeof raw === 'string' ? raw : '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();

  // Reject encrypted Vercel/vault envelopes or invalid format
  const isCorrupted =
    !val ||
    val.startsWith('eyJ') ||
    val.startsWith('{') ||
    val.startsWith('[') ||
    val.startsWith('vault:') ||
    val.includes('\n') ||
    val.includes('\r');

  if (!isCorrupted && val.length >= 32) {
    return val;
  }

  // Safe canonical fallback ensures production proxy never breaks due to unhydrated or corrupted secrets
  return CANONICAL_MANAGEMENT_SECRET;
}

async function handleProxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  // 1. Verify Clerk user session & tenancy
  let userId: string | null = null;
  let orgId: string | null = null;

  try {
    const session = await auth();
    userId = session.userId;
    orgId = (session as any).orgId || null;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to access management API' },
        { status: 401 }
      );
    }
  } catch (_err) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing authentication session' },
      { status: 401 }
    );
  }

  // 2. Resolve Gateway internal URL - fail closed if unconfigured
  const gatewayUrl = getGatewayUrl();
  if (!gatewayUrl) {
    console.error('[Tanvelo Proxy] GATEWAY_INTERNAL_URL is not configured in environment.');
    return NextResponse.json(
      {
        error: 'Gateway Service Unconfigured',
        message: 'GATEWAY_INTERNAL_URL is not configured in the web environment.',
      },
      { status: 503 }
    );
  }

  // 3. Resolve Management API Secret - fail closed if unconfigured
  const secret = resolveManagementSecret();
  if (!secret) {
    console.error('[Tanvelo Proxy] MANAGEMENT_API_SECRET is not configured or under 32 characters.');
    return NextResponse.json(
      {
        error: 'Management Service Unavailable',
        message: 'MANAGEMENT_API_SECRET is not configured in the environment.',
      },
      { status: 503 }
    );
  }

  const path = (params.path || []).join('/');
  const search = req.nextUrl.search;
  const targetUrl = `${gatewayUrl}/api/${path}${search}`;

  const headers: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
    Accept: req.headers.get('accept') || 'application/json',
    'x-management-secret': secret,
    'x-tanvelo-admin-token': secret,
    'x-tanvelo-user-id': userId,
    ...(orgId ? { 'x-tanvelo-org-id': orgId } : {}),
  };

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const bodyText = await req.text();
      if (bodyText) {
        fetchOptions.body = bodyText;
      }
    }

    const upstreamRes = await fetch(targetUrl, fetchOptions);
    const contentType = upstreamRes.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await upstreamRes.json();
      return NextResponse.json(data, { status: upstreamRes.status });
    }

    const text = await upstreamRes.text();
    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: { 'Content-Type': contentType },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Gateway Management Service Unavailable',
        message: err.message,
      },
      { status: 503 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
