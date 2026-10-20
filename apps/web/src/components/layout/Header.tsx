'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { useMobileNav } from '@/context/MobileNavContext';
import { FolderGit2, Layers, KeyRound, Cpu, Menu } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

export function Header() {
  const { projects, currentProject, currentEnvironment, setCurrentProject, setCurrentEnvironment } = useProject();
  const { toggle } = useMobileNav();
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
      {/* Left Area: Mobile Menu Button & Project Selectors */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={toggle}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Logo on small screens */}
        <Link href="/" className="lg:hidden flex-shrink-0 mr-1">
          <Logo size="sm" />
        </Link>

        {/* Project Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 transition rounded-lg px-2 sm:px-3 py-1.5 text-xs text-slate-700 shadow-2xs max-w-[130px] sm:max-w-[200px]">
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

        {/* Environment Selector (collapses cleanly on tiny screens) */}
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
        {/* Latency & Gateway Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-mono shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="hidden md:inline">Gateway</span>
          <span>:4000</span>
          {pingMs !== null && <span className="text-emerald-600 font-medium">({pingMs}ms)</span>}
        </div>

        <Link
          href="/providers"
          className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-lg transition shadow-2xs"
          title="Configure Providers"
        >
          <Cpu className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden sm:inline">Providers</span>
        </Link>

        <Link
          href="/api-keys"
          className="flex items-center gap-1.5 text-xs text-white bg-slate-900 hover:bg-black border border-slate-800 px-2.5 sm:px-3.5 py-1.5 rounded-lg transition shadow-2xs font-medium"
          title="Generate API Key"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">API Key</span>
        </Link>
      </div>
    </header>
  );
}
