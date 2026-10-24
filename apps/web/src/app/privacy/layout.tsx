import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy & Google API Data Compliance | Tanvelo',
  description:
    'Tanvelo (tanvelo.xyz) Privacy Policy: detailed Google API Services User Data Policy compliance, Zero Body Retention guarantee, AES-256 encryption, and user data rights.',
  keywords: [
    'Tanvelo Privacy Policy',
    'Google API Services User Data Policy',
    'Google OAuth Compliance',
    'Zero Retention AI Gateway',
    'HIPAA GDPR AI Proxy',
    'Zero Prompt Logging',
    'tanvelo.xyz privacy',
  ],
  alternates: {
    canonical: 'https://www.tanvelo.xyz/privacy',
  },
  openGraph: {
    title: 'Privacy Policy & Google API Data Compliance | Tanvelo',
    description:
      'Tanvelo Privacy Policy: Google API Services User Data Policy compliance, Zero Body Retention guarantee, and data privacy principles.',
    url: 'https://www.tanvelo.xyz/privacy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy & Google API Data Compliance | Tanvelo',
    description:
      'Tanvelo Privacy Policy: Google API Services User Data Policy compliance and Zero Body Retention guarantee.',
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
