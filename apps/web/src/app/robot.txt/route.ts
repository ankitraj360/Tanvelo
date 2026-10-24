import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tanvelo.xyz';
  const content = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Allow: /docs
Allow: /privacy
Allow: /terms
Allow: /sign-in
Allow: /sign-up

# Disallow internal and protected console dashboard routes
Disallow: /api/
Disallow: /overview
Disallow: /analytics
Disallow: /requests
Disallow: /requests/
Disallow: /budgets
Disallow: /models
Disallow: /routing
Disallow: /providers
Disallow: /rate-limits
Disallow: /errors
Disallow: /webhooks
Disallow: /api-keys
Disallow: /projects
Disallow: /projects/
Disallow: /settings
Disallow: /_next/

# Host & Sitemap specification
Host: ${baseUrl}
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap.txt
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
