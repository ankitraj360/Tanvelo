import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Tanvelo (tanvelo.xyz) to access your LLM federation gateway, telemetry, and API keys.',
  keywords: ['Tanvelo Sign In', 'Tanvelo Login', 'LLM Gateway Console', 'tanvelo.xyz login'],
  alternates: {
    canonical: 'https://www.tanvelo.xyz/sign-in',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
