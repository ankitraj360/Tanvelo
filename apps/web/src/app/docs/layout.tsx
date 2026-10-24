import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation — Official SDK & API Reference',
  description:
    'Complete documentation for Tanvelo (tanvelo.xyz): official TypeScript & Python SDKs, REST API endpoints, failover routing, Redis rate limiting, and SSE streaming integration.',
  keywords: [
    'Tanvelo Docs',
    'Tanvelo SDK Documentation',
    'LLM Gateway API Reference',
    'AI Gateway Integration',
    'TypeScript SDK LLM',
    'Python SDK LLM',
    'Chat Completions API Proxy',
    'Failover Configuration',
    'Redis Rate Limiting API',
    'tanvelo.xyz docs',
    'tanvelo api documentation',
  ],
  alternates: {
    canonical: 'https://www.tanvelo.xyz/docs',
  },
  openGraph: {
    title: 'Tanvelo Documentation — Official SDK & API Reference',
    description:
      'Quickstart guides, TypeScript & Python SDK references, circuit-breaker failover configuration, and REST API docs for the Tanvelo LLM gateway.',
    url: 'https://www.tanvelo.xyz/docs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tanvelo Documentation — Official SDK & API Reference',
    description:
      'Quickstart guides, TypeScript & Python SDK references, circuit-breaker failover configuration, and REST API docs for the Tanvelo LLM gateway.',
    site: '@tanvelo_xyz',
    creator: '@tanvelo_xyz',
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
