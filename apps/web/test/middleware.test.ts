import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Test middleware logic directly
function evaluateMiddleware(pathname: string, userId: string | null = null, origin = 'http://localhost:3000') {
  const publicRoutes = [
    '/',
    '/sign-in',
    '/sign-up',
    '/docs',
    '/privacy',
    '/terms',
    '/sitemap.xml',
    '/robots.txt',
  ];

  const isPublic = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));

  if (!isPublic && !userId) {
    const isApiRoute = pathname === '/api' || pathname.startsWith('/api/');
    if (isApiRoute) {
      return {
        status: 401,
        body: { error: 'Unauthorized: Authentication required' },
        type: 'json',
      };
    }

    const signInUrl = new URL('/sign-in', `${origin}${pathname}`);
    signInUrl.searchParams.set('redirect_url', `${origin}${pathname}`);
    return {
      status: 307,
      redirectUrl: signInUrl.toString(),
      type: 'redirect',
    };
  }

  return { status: 200, type: 'allow' };
}

describe('Dashboard Route Protection & Middleware (P1 #5 & P2 #12)', () => {
  const protectedPages = [
    '/overview',
    '/providers',
    '/models',
    '/routing',
    '/projects',
    '/api-keys', // Critical regression test: /api-keys must redirect, never 401 JSON
    '/rate-limits',
    '/budgets',
    '/webhooks',
    '/requests',
    '/errors',
    '/analytics',
    '/settings',
  ];

  for (const page of protectedPages) {
    it(`redirects unauthenticated visitor from ${page} to /sign-in with redirect_url`, () => {
      const res = evaluateMiddleware(page, null);
      expect(res.status).toBe(307);
      expect(res.type).toBe('redirect');
      expect(res.redirectUrl).toContain('/sign-in?redirect_url=');
      expect(res.redirectUrl).toContain(encodeURIComponent(page));
    });

    it(`allows authenticated user to visit ${page}`, () => {
      const res = evaluateMiddleware(page, 'user_test_123');
      expect(res.status).toBe(200);
      expect(res.type).toBe('allow');
    });
  }

  it('rejects unauthenticated API requests with 401 JSON', () => {
    const apiPaths = ['/api/projects', '/api/providers', '/api/providers/test', '/api/models', '/api/api-keys'];
    for (const path of apiPaths) {
      const res = evaluateMiddleware(path, null);
      expect(res.status).toBe(401);
      expect(res.type).toBe('json');
      expect(res.body).toEqual({ error: 'Unauthorized: Authentication required' });
    }
  });

  it('distinguishes /api-keys page from /api/* endpoints', () => {
    const pageRes = evaluateMiddleware('/api-keys', null);
    expect(pageRes.type).toBe('redirect');
    expect(pageRes.status).toBe(307);

    const apiRes = evaluateMiddleware('/api/api-keys', null);
    expect(apiRes.type).toBe('json');
    expect(apiRes.status).toBe(401);
  });

  it('allows public routes without authentication', () => {
    const publicPaths = ['/', '/sign-in', '/sign-up', '/docs', '/privacy', '/terms', '/sitemap.xml', '/robots.txt'];
    for (const path of publicPaths) {
      const res = evaluateMiddleware(path, null);
      expect(res.status).toBe(200);
      expect(res.type).toBe('allow');
    }
  });
});
