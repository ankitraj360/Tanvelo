import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tanvelo — Universal LLM Gateway',
    short_name: 'Tanvelo',
    description: 'Production-ready LLM API gateway with automated failover, rate limits, and official SDKs.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/assets/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/assets/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
