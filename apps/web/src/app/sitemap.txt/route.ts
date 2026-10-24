import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tanvelo.xyz';
  const urls = [
    `${baseUrl}/`,
    `${baseUrl}/docs`,
    `${baseUrl}/privacy`,
    `${baseUrl}/terms`,
    `${baseUrl}/sign-in`,
    `${baseUrl}/sign-up`,
  ];

  return new NextResponse(urls.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
