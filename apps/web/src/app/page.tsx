import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'Tanvelo — Universal LLM Gateway for 147+ AI Providers & Custom APIs',
  description:
    'Production-grade LLM gateway supporting 147+ AI providers and custom OpenAI-compatible endpoints with sub-180ms automated failover, atomic Redis rate limits, zero prompt retention, and official TypeScript & Python SDKs.',
  keywords: [
    'Tanvelo',
    'tanvelo.xyz',
    'www.tanvelo.xyz',
    'LLM Gateway',
    'AI Gateway',
    'OpenAI Compatible Gateway',
    'Multi-Provider LLM Routing',
    'LLM Failover Circuit Breaker',
    'Redis Rate Limiter',
    'Zero Prompt Retention',
    'High Availability AI Proxy',
    'AI Cost Telemetry',
    'Enterprise AI Gateway',
  ],
  alternates: {
    canonical: 'https://www.tanvelo.xyz',
  },
  openGraph: {
    title: 'Tanvelo — Universal LLM Gateway for 147+ AI Providers & Custom APIs',
    description:
      'Production-grade LLM gateway supporting 147+ AI providers with sub-180ms automated failover, atomic Redis rate limits, and zero prompt retention.',
    url: 'https://www.tanvelo.xyz',
    siteName: 'Tanvelo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tanvelo — Universal LLM Gateway for 147+ AI Providers & Custom APIs',
    description:
      'Production-grade LLM gateway with sub-180ms automated failovers, atomic Redis rate limits, and zero prompt retention.',
    site: '@tanvelo_xyz',
    creator: '@tanvelo_xyz',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How many AI providers does Tanvelo support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tanvelo supports 147+ AI providers out of the box — including OpenAI, Anthropic Claude, Google Gemini, Cerebras, Groq, Together AI, DeepSeek, xAI (Grok), Mistral, AWS Bedrock, Azure OpenAI, Ollama, vLLM, and Alibaba Qwen — plus ANY custom or on-premise OpenAI-compatible API endpoint with custom base URLs and authentication headers.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Tanvelo save my users\' questions or AI answers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Unlike traditional gateways like Portkey and Helicone which log and store prompt bodies and AI completions in their cloud databases by default, Tanvelo strictly enforces Zero Payload Retention by default (LOG_PAYLOADS=false). All token streams pass through transient RAM via Server-Sent Events (SSE) and are immediately discarded.',
      },
    },
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
      name: 'How does the sub-180ms fallback circuit breaker work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When an upstream provider returns a 429 rate limit or 5xx outage, Tanvelo immediately re-routes the in-flight request to secondary fallback models without terminating the client connection or dropping active SSE chunks.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Tanvelo compare to Portkey, Helicone, and OpenRouter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Portkey and Helicone log and retain full request/response bodies by default, posing data compliance hurdles for healthcare, fintech, and legal apps. OpenRouter marks up token prices with a 5.5%–8% deposit fee. Tanvelo offers Zero Retention by default, true Bring-Your-Own-Key (BYOK) with AES-256-GCM encryption, and flat request-based pricing with zero markup on your LLM tokens.',
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
