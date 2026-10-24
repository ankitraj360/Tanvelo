import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tanvelo.xyz';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/docs', '/privacy', '/terms', '/sign-in', '/sign-up'],
        disallow: [
          '/api/',
          '/overview',
          '/requests/',
          '/errors',
          '/analytics',
          '/providers',
          '/models',
          '/routing',
          '/projects',
          '/api-keys',
          '/rate-limits',
          '/budgets',
          '/webhooks',
          '/settings',
        ],
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap.txt`],
    host: baseUrl,
  };
}
