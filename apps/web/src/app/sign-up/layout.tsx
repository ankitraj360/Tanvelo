import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Tanvelo (tanvelo.xyz) account to start routing LLM traffic with sub-180ms automated failover.',
  keywords: ['Tanvelo Sign Up', 'Tanvelo Register', 'LLM Gateway Signup', 'Create AI Gateway Account', 'tanvelo.xyz signup'],
  alternates: {
    canonical: 'https://www.tanvelo.xyz/sign-up',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
