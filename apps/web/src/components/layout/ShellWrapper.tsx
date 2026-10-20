'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProjectProvider } from '@/context/ProjectContext';
import { MobileNavProvider } from '@/context/MobileNavContext';

export function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    return <>{children}</>;
  }

  return (
    <ProjectProvider>
      <MobileNavProvider>
        <div className="bg-[#F8FAFC] text-slate-900 min-h-screen flex antialiased w-full overflow-x-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <Header />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#F8FAFC] text-slate-900 w-full max-w-full">
              {children}
            </main>
          </div>
        </div>
      </MobileNavProvider>
    </ProjectProvider>
  );
}
