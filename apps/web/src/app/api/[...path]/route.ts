import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || 'http://127.0.0.1:4001';
const MANAGEMENT_SECRET = process.env.MANAGEMENT_API_SECRET || '';

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

  const headers: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
    Accept: req.headers.get('accept') || 'application/json',
  };

  if (MANAGEMENT_SECRET) {
    headers['x-management-secret'] = MANAGEMENT_SECRET;
  }

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
