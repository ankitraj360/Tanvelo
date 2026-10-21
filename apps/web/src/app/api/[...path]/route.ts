import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const GATEWAY_URL =
  process.env.GATEWAY_INTERNAL_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://tanvelo-backend-zgyc.onrender.com'
    : 'http://127.0.0.1:4001');

const FALLBACK_MANAGEMENT_SECRET = 'c8e6f1a4d9b2e7c3a0f5d8b1e4c7a2f9c8e6f1a4d9b2e7c3a0f5d8b1e4c7a2f9';

function resolveManagementSecret(): string {
  const envVal = process.env.MANAGEMENT_API_SECRET?.trim().replace(/^["']|["']$/g, '');
  // Ignore encrypted Vercel blobs or too-short secrets, safely fallback to canonical secret
  if (envVal && !envVal.startsWith('eyJ') && envVal.length >= 32) {
    return envVal;
  }
  return FALLBACK_MANAGEMENT_SECRET;
}

async function handleProxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  // 1. Verify Clerk user session
  try {
    const { userId } = await auth();
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

  const path = (params.path || []).join('/');
  const search = req.nextUrl.search;
  const targetUrl = `${GATEWAY_URL}/api/${path}${search}`;

  const secret = resolveManagementSecret();

  const headers: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
    Accept: req.headers.get('accept') || 'application/json',
    'x-management-secret': secret,
    'x-tanvelo-admin-token': secret,
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
