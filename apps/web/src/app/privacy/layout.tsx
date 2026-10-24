import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy & Zero Retention Guarantee',
  description:
    'Tanvelo (tanvelo.xyz) Privacy Policy: our Zero Body Retention guarantee, data handling principles, and commitment to never persisting your prompts or AI completion outputs.',
  keywords: [
    'Tanvelo Privacy Policy',
    'Zero Retention AI Gateway',
    'HIPAA GDPR AI Proxy',
    'Zero Prompt Logging',
    'tanvelo.xyz privacy',
  ],
  alternates: {
    canonical: 'https://www.tanvelo.xyz/privacy',
  },
  openGraph: {
    title: 'Privacy Policy & Zero Retention Guarantee | Tanvelo',
    description:
      'Tanvelo Privacy Policy: our Zero Body Retention guarantee and commitment to never persisting your prompts or completions.',
    url: 'https://www.tanvelo.xyz/privacy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy & Zero Retention Guarantee | Tanvelo',
    description:
      'Tanvelo Zero Body Retention guarantee and privacy compliance principles.',
    site: '@tanvelo_xyz',
    creator: '@tanvelo_xyz',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
