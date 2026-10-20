'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  Cpu,
  Boxes,
  Activity,
  AlertTriangle,
  Gauge,
  BarChart3,
  Coins,
  GitFork,
  KeyRound,
  Webhook,
  BookOpen,
  Settings,
  ShieldCheck,
  ShieldAlert,
  FileText,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { useMobileNav } from '@/context/MobileNavContext';
import { UserButton } from '@clerk/nextjs';

const navGroups = [
  {
    title: 'Monitor & Traffic',
    items: [
      { name: 'Overview', href: '/overview', icon: LayoutDashboard },
      { name: 'API Requests', href: '/requests', icon: Activity },
      { name: 'Errors & Outages', href: '/errors', icon: AlertTriangle },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Providers & Models',
    items: [
      { name: 'Providers & Custom', href: '/providers', icon: Cpu },
      { name: 'Model Catalog', href: '/models', icon: Boxes },
      { name: 'Routing & Fallbacks', href: '/routing', icon: GitFork },
    ],
  },
  {
    title: 'Governance & Security',
    items: [
      { name: 'Projects & Envs', href: '/projects', icon: FolderGit2 },
      { name: 'Gateway API Keys', href: '/api-keys', icon: KeyRound },
      { name: 'Rate Limits', href: '/rate-limits', icon: Gauge },
      { name: 'Usage & Budgets', href: '/budgets', icon: Coins },
      { name: 'Webhooks & Events', href: '/webhooks', icon: Webhook },
    ],
  },
  {
    title: 'Developer Center',
    items: [
      { name: 'API Documentation', href: '/docs', icon: BookOpen },
      { name: 'Settings & Security', href: '/settings', icon: Settings },
    ],
  },
  {
    title: 'Legal & Trust',
    items: [
      { name: 'Privacy Policy', href: '/privacy', icon: ShieldCheck },
      { name: 'Terms of Service', href: '/terms', icon: FileText },
    ],
  },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-white flex-shrink-0">
        <Link href="/" onClick={onClose} className="hover:opacity-90 transition">
          <Logo size="md" />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden transition"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 text-[10px] font-mono font-semibold tracking-wider uppercase text-slate-400">
              {group.title}
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group relative',
                      isActive
                        ? 'bg-sky-50 text-sky-800 font-semibold border border-sky-200 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors flex-shrink-0',
                          isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-700'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-600 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Security & User Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0 w-full">
            <UserButton
              showName
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  userButtonBox: 'flex-row-reverse gap-2 w-full justify-start text-xs font-medium text-slate-700',
                  userButtonOuterIdentifier: 'truncate text-xs font-medium text-slate-800 max-w-[130px]',
                  avatarBox: 'w-6 h-6 rounded-md',
                },
              }}
            />
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1.5 text-slate-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              Security Active
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Bound to <code className="text-sky-700 font-mono bg-sky-50 px-1 py-0.5 rounded">127.0.0.1</code>. Isolated gateway trust domain.
          </p>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const { isOpen, close } = useMobileNav();

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-slate-200 flex-col h-screen sticky top-0 select-none z-20 shadow-xs">
        <NavContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Slide-over */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 lg:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-in-out border-r border-slate-200 select-none',
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        <NavContent onClose={close} />
      </aside>
    </>
  );
}
