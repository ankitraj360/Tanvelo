import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Tanvelo (tanvelo.xyz) Terms of Service and API usage agreement. Review our terms for gateway proxy usage, SLA policies, and enterprise billing.',
  keywords: [
    'Tanvelo Terms of Service',
    'Tanvelo SLA',
    'AI Gateway Terms',
    'tanvelo.xyz terms',
  ],
  alternates: {
    canonical: 'https://www.tanvelo.xyz/terms',
  },
  openGraph: {
    title: 'Terms of Service | Tanvelo',
    description:
      'Tanvelo Terms of Service: terms for gateway proxy usage, SLA policies, and enterprise billing.',
    url: 'https://www.tanvelo.xyz/terms',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Tanvelo',
    description:
      'Tanvelo Terms of Service and API usage policies.',
    site: '@tanvelo_xyz',
    creator: '@tanvelo_xyz',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
