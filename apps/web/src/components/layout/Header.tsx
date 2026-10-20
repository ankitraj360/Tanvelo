'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { FolderGit2, Layers, KeyRound, Cpu } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { projects, currentProject, currentEnvironment, setCurrentProject, setCurrentEnvironment } = useProject();
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
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
      {/* Project & Environment Dropdowns */}
      <div className="flex items-center gap-3">
        {/* Project Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 transition rounded-lg px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
          <FolderGit2 className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-slate-500 font-mono text-[11px]">Workspace:</span>
          <select
            value={currentProject?.id || ''}
            onChange={(e) => {
              const p = projects.find((proj) => proj.id === e.target.value);
              if (p) setCurrentProject(p);
            }}
            className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer text-xs"
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
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 transition rounded-lg px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500 font-mono text-[11px]">Env:</span>
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

      {/* Gateway Engine & Quick Links */}
      <div className="flex items-center gap-3">
        {/* Latency & Gateway Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-mono shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Gateway :4000</span>
          {pingMs !== null && <span className="text-emerald-600 font-medium">({pingMs}ms)</span>}
        </div>

        <Link
          href="/providers"
          className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition shadow-2xs"
        >
          <Cpu className="w-3.5 h-3.5 text-sky-600" />
          <span>Providers</span>
        </Link>

        <Link
          href="/api-keys"
          className="flex items-center gap-1.5 text-xs text-white bg-slate-900 hover:bg-black border border-slate-800 px-3.5 py-1.5 rounded-lg transition shadow-2xs font-medium"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>API Key</span>
        </Link>
      </div>
    </header>
  );
}
