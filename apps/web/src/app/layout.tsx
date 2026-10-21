import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ShellWrapper } from '@/components/layout/ShellWrapper';

export const metadata: Metadata = {
  title: 'Tanvelo — One gateway for every LLM',
  description: 'Production-ready LLM API Gateway with intelligent routing, fallbacks, rate-limiting, and cost tracking.',
  icons: {
    icon: [
      { url: '/assets/logo.svg', type: 'image/svg+xml' },
      { url: '/assets/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/assets/logo.svg',
    apple: '/assets/logo.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen antialiased bg-white">
          <ShellWrapper>{children}</ShellWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
