import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'Tanvelo — Universal LLM Federation Gateway & High-Availability AI Proxy',
  description:
    'Production-grade LLM gateway with sub-180ms automated failover, atomic Redis rate limits, zero prompt retention, and official TypeScript & Python SDKs.',
  alternates: {
    canonical: 'https://tanvelo.in',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the Tanvelo Official SDK?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The official Tanvelo SDK (tanvelo on npm and PyPI) is a lightweight, zero-dependency client with native multi-provider fallbacks, Server-Sent Events (SSE) streaming, and real-time latency and cost telemetry.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the sub-180ms circuit breaker work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When an upstream provider returns a 429 rate limit or 5xx outage, Tanvelo immediately re-routes the in-flight request to secondary fallback models without terminating the client connection or dropping active SSE chunks.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I enforce rate limits and hard spend caps?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Tanvelo provides atomic Redis token-bucket rate limiting (RPM/TPM) and project-level monthly budget ceilings that cut off requests before runaway agent loops accumulate cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Tanvelo store prompt contents or completions?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Tanvelo strictly enforces Zero Body Retention. Payloads are processed in-flight and never persisted to disk. Only operational metrics (latency, token usage, cost, status codes) are logged in the ledger.',
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingPage />
    </>
  );
}
