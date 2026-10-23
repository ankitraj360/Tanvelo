import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation — Official SDK & API Reference',
  description:
    'Complete documentation for the Tanvelo universal LLM gateway: official TypeScript & Python SDKs, REST API endpoints, failover routing, rate limiting, and SSE streaming integration.',
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
  ],
  alternates: {
    canonical: 'https://tanvelo.in/docs',
  },
  openGraph: {
    title: 'Tanvelo Documentation — Official SDK & API Reference',
    description:
      'Quickstart guides, TypeScript & Python SDK references, circuit-breaker failover configuration, and REST API docs for the Tanvelo LLM gateway.',
    url: 'https://tanvelo.in/docs',
  },
  twitter: {
    title: 'Tanvelo Documentation — Official SDK & API Reference',
    description:
      'Quickstart guides, TypeScript & Python SDK references, circuit-breaker failover configuration, and REST API docs for the Tanvelo LLM gateway.',
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
