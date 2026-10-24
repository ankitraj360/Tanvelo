import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ShellWrapper } from '@/components/layout/ShellWrapper';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.tanvelo.xyz'),
  title: {
    default: 'Tanvelo — Universal LLM Federation Gateway & High-Availability AI Proxy',
    template: '%s | Tanvelo',
  },
  description:
    'Tanvelo (www.tanvelo.xyz) is the universal LLM federation gateway & high-availability AI proxy for production AI applications. Sub-180ms automated failover across 147+ AI providers, atomic Redis rate limiting, zero prompt retention, and official TypeScript & Python SDKs.',
  keywords: [
    'Tanvelo',
    'tanvelo.xyz',
    'www.tanvelo.xyz',
    'LLM Gateway',
    'AI Gateway',
    'LLM API Gateway',
    'AI Proxy',
    'High Availability AI Proxy',
    'Universal LLM Federation Gateway',
    'LLM Router',
    'Multi-Provider LLM Routing',
    'LLM Failover',
    'AI Circuit Breaker',
    'Automated Model Failover',
    'OpenAI Compatible Gateway',
    'Anthropic Claude Proxy',
    'Google Gemini Gateway',
    'DeepSeek API Proxy',
    'Groq Proxy',
    'Cerebras LLM Gateway',
    'Together AI Proxy',
    'Mistral AI Proxy',
    'Ollama Proxy',
    'vLLM Gateway',
    'LLM Rate Limiting',
    'Token Bucket Rate Limiter',
    'AI Cost Telemetry',
    'Zero Prompt Retention',
    'Zero Data Retention AI Proxy',
    'Tanvelo SDK',
    'tanvelo python',
    'tanvelo npm',
    'AI Infrastructure',
    'Enterprise AI Gateway',
    'Server-Sent Events SSE Streaming',
    'BYOK AI Gateway',
  ],
  authors: [{ name: 'Tanvelo', url: 'https://www.tanvelo.xyz' }],
  creator: 'Tanvelo',
  publisher: 'Tanvelo Inc.',
  applicationName: 'Tanvelo',
  category: 'technology',
  classification: 'Developer Tools / AI Infrastructure',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://www.tanvelo.xyz',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.tanvelo.xyz',
    siteName: 'Tanvelo',
    title: 'Tanvelo — Universal LLM Federation Gateway & High-Availability AI Proxy',
    description:
      'Production-grade LLM gateway with sub-180ms failovers, deterministic routing, atomic Redis rate limits, real-time cost telemetry, and official TypeScript & Python SDKs.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Tanvelo — Universal LLM Federation Gateway',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tanvelo — Universal LLM Federation Gateway',
    description:
      'Production-grade LLM gateway with sub-180ms automated failovers, atomic Redis rate limits, and zero prompt retention.',
    site: '@tanvelo_xyz',
    creator: '@tanvelo_xyz',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/assets/logo.svg', type: 'image/svg+xml' },
      { url: '/assets/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/assets/logo.svg',
    apple: '/assets/logo.svg',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.tanvelo.xyz/#organization',
      name: 'Tanvelo',
      url: 'https://www.tanvelo.xyz',
      logo: 'https://www.tanvelo.xyz/assets/logo.svg',
      sameAs: [
        'https://x.com/tanvelo_xyz',
        'https://instagram.com/tanvelo_xyz',
        'https://github.com/ankitraj360/Tanvelo',
      ],
      description: 'Universal LLM Federation Gateway for enterprise AI systems.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.tanvelo.xyz/#website',
      url: 'https://www.tanvelo.xyz',
      name: 'Tanvelo',
      publisher: {
        '@id': 'https://www.tanvelo.xyz/#organization',
      },
      description: 'Universal LLM Federation Gateway and High-Availability AI Proxy.',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.tanvelo.xyz/#software',
      name: 'Tanvelo LLM Gateway',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'Intelligent multi-provider LLM federation gateway with sub-180ms automated failover, token-bucket rate limiting, and zero data retention.',
      url: 'https://www.tanvelo.xyz',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/overview"
      signUpFallbackRedirectUrl="/overview"
      telemetry={{ disabled: true }}
    >
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://clerk.tanvelo.xyz" />
          <link rel="dns-prefetch" href="https://clerk.tanvelo.xyz" />
          <link rel="preconnect" href="https://accounts.google.com" />
          <link rel="dns-prefetch" href="https://accounts.google.com" />
          <link rel="preconnect" href="https://github.com" />
          <link rel="dns-prefetch" href="https://github.com" />
          <link rel="preconnect" href="https://img.clerk.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://img.clerk.com" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        </head>
        <body className="min-h-screen antialiased bg-white">
          <ShellWrapper>{children}</ShellWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
