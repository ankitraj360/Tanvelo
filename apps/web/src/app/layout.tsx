import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProjectProvider } from '@/context/ProjectContext';

export const metadata: Metadata = {
  title: 'Tanvelo — LLM API Gateway',
  description: 'Production-ready LLM API Gateway with intelligent routing, fallbacks, rate-limiting, and cost tracking.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F19] text-slate-100 min-h-screen flex antialiased">
        <ProjectProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <Header />
            <main className="flex-1 p-8 overflow-y-auto">{children}</main>
          </div>
        </ProjectProvider>
      </body>
    </html>
  );
}
