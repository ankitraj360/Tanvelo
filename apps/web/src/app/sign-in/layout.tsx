import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Tanvelo to access your LLM federation gateway, telemetry, and API keys.',
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
