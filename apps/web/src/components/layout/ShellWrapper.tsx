'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProjectProvider } from '@/context/ProjectContext';
import { MobileNavProvider, useMobileNav } from '@/context/MobileNavContext';
import { cn } from '@/lib/utils';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useMobileNav();

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen antialiased w-full overflow-x-hidden relative">
      <Sidebar />
      <div
        className={cn(
          'flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:pl-0' : 'lg:pl-64'
        )}
      >
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#F8FAFC] text-slate-900 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  const isStandalonePage =
    pathname === '/' ||
    pathname?.startsWith('/sign-in') ||
    pathname?.startsWith('/sign-up') ||
    pathname?.startsWith('/sso-callback') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/docs' ||
    pathname?.startsWith('/docs');

  // If user signs out while on a dashboard route, automatically redirect to landing page
  useEffect(() => {
    if (isLoaded && !userId && !isStandalonePage) {
      router.replace('/');
    }
  }, [isLoaded, userId, isStandalonePage, router]);

  if (isStandalonePage) {
    return <>{children}</>;
  }

  // Prevent loading queries or flashing dashboard UI when signing out or unauthenticated
  if (isLoaded && !userId) {
    return null;
  }

  return (
    <ProjectProvider>
      <MobileNavProvider>
        <DashboardShell>{children}</DashboardShell>
      </MobileNavProvider>
    </ProjectProvider>
  );
}
