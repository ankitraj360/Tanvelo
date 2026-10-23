import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Tanvelo Terms of Service and API usage agreement. Review our terms for gateway proxy usage, SLA policies, and enterprise billing.',
  alternates: {
    canonical: 'https://tanvelo.in/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
