import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy & Zero Retention Guarantee',
  description:
    'Tanvelo Privacy Policy: our Zero Body Retention guarantee, data handling principles, and commitment to never persisting your prompts or AI completion outputs.',
  alternates: {
    canonical: 'https://tanvelo.in/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
