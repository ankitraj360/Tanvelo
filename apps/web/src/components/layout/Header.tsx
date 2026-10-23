'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { useMobileNav } from '@/context/MobileNavContext';
import { FolderGit2, Layers, KeyRound, PanelLeft, PanelLeftOpen } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export function Header() {
  const { projects, currentProject, currentEnvironment, setCurrentProject, setCurrentEnvironment } = useProject();
  const { isCollapsed, toggleSidebar } = useMobileNav();
  const [pingMs, setPingMs] = useState<number | null>(null);

  useEffect(() => {
    const checkPing = async () => {
      const start = performance.now();
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          setPingMs(Math.round(performance.now() - start));
        }
      } catch (_) {
        setPingMs(null);
      }
    };

    checkPing();
    const interval = setInterval(checkPing, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
      {/* Left Area: Sidebar Toggle & Project Selectors */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Unified Sidebar / Menu Bar Toggle Button (Desktop & Mobile) */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center justify-center cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-slate-700" />
          ) : (
            <PanelLeft className="w-5 h-5 text-slate-700" />
          )}
        </button>

        {/* Brand Logo: shown when sidebar is collapsed on desktop, or always on mobile */}
        <Link
          href="/"
          className={cn(
            'flex-shrink-0 mr-1 transition-all',
            isCollapsed ? 'flex' : 'lg:hidden flex'
          )}
        >
          <Logo size="sm" />
        </Link>

        {/* Workspace / Project Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 transition rounded-lg px-2 sm:px-3 py-1.5 text-xs text-slate-700 shadow-2xs max-w-[150px] sm:max-w-[220px]">
          <FolderGit2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
          <span className="text-slate-500 font-mono text-[11px] hidden md:inline">Workspace:</span>
          <select
            value={currentProject?.id || ''}
            onChange={(e) => {
              const p = projects.find((proj) => proj.id === e.target.value);
              if (p) setCurrentProject(p);
            }}
            className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer text-xs truncate max-w-full"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-white text-slate-900 py-1">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Environment Selector */}
        {currentProject && currentProject.environments?.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 transition rounded-lg px-2 sm:px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span className="text-slate-500 font-mono text-[11px] hidden md:inline">Env:</span>
            <select
              value={currentEnvironment?.id || ''}
              onChange={(e) => {
                const env = currentProject.environments.find((en) => en.id === e.target.value);
                if (env) setCurrentEnvironment(env);
              }}
              className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {currentProject.environments.map((env) => (
                <option key={env.id} value={env.id} className="bg-white text-slate-900 py-1">
                  {env.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right Area: Gateway Status Pill & Quick Action Links */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Gateway Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-mono shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <span>Gateway Active</span>
          {pingMs !== null && <span className="text-emerald-600 font-medium font-sans">({pingMs}ms)</span>}
        </div>

        <Link
          href="/api-keys"
          className="flex items-center gap-1.5 text-xs text-white bg-slate-900 hover:bg-black border border-slate-800 px-2.5 sm:px-3.5 py-1.5 rounded-lg transition shadow-2xs font-medium"
          title="Generate API Key"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">API Key</span>
        </Link>

        <div className="flex items-center pl-1 sm:pl-1.5 border-l border-slate-200">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg ring-1 ring-slate-200 hover:ring-slate-300 transition',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
