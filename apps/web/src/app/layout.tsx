import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ShellWrapper } from '@/components/layout/ShellWrapper';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tanvelo.in'),
  title: {
    default: 'Tanvelo — Universal LLM Federation Gateway & High-Availability AI Proxy',
    template: '%s | Tanvelo',
  },
  description:
    'Tanvelo is the universal LLM federation gateway for production AI applications. Sub-180ms automated failover, atomic Redis rate limiting, zero prompt retention, and official TypeScript & Python SDKs.',
  keywords: [
    'LLM Gateway',
    'AI Gateway',
    'LLM API Gateway',
    'AI Proxy',
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
    'LLM Rate Limiting',
    'Token Bucket Rate Limiter',
    'AI Cost Telemetry',
    'Zero Prompt Retention',
    'Tanvelo',
    'Tanvelo SDK',
    'AI Infrastructure',
    'Enterprise AI Gateway',
    'Server-Sent Events SSE Streaming',
  ],
  authors: [{ name: 'Tanvelo', url: 'https://tanvelo.in' }],
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
    canonical: 'https://tanvelo.in',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tanvelo.in',
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
    site: '@tanvelo_in',
    creator: '@tanvelo_in',
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
      '@id': 'https://tanvelo.in/#organization',
      name: 'Tanvelo',
      url: 'https://tanvelo.in',
      logo: 'https://tanvelo.in/assets/logo.svg',
      sameAs: [
        'https://x.com/tanvelo_in',
        'https://instagram.com/tanvelo_in',
      ],
      description: 'Universal LLM Federation Gateway for enterprise AI systems.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://tanvelo.in/#website',
      url: 'https://tanvelo.in',
      name: 'Tanvelo',
      publisher: {
        '@id': 'https://tanvelo.in/#organization',
      },
      description: 'Universal LLM Federation Gateway and High-Availability AI Proxy.',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://tanvelo.in/#software',
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
      url: 'https://tanvelo.in',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
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
