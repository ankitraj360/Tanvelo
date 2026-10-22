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
  X,
  PanelLeftClose,
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
      { name: 'Requests', href: '/requests', icon: Activity },
      { name: 'Errors', href: '/errors', icon: AlertTriangle },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Routing & Models',
    items: [
      { name: 'Providers', href: '/providers', icon: Cpu },
      { name: 'Models', href: '/models', icon: Boxes },
      { name: 'Routing', href: '/routing', icon: GitFork },
    ],
  },
  {
    title: 'Control & Security',
    items: [
      { name: 'Projects', href: '/projects', icon: FolderGit2 },
      { name: 'API Keys', href: '/api-keys', icon: KeyRound },
      { name: 'Rate Limits', href: '/rate-limits', icon: Gauge },
      { name: 'Budgets', href: '/budgets', icon: Coins },
      { name: 'Webhooks', href: '/webhooks', icon: Webhook },
    ],
  },
  {
    title: 'Developer',
    items: [
      { name: 'Documentation', href: '/docs', icon: BookOpen },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

function NavContent({
  onClose,
  onCollapse,
}: {
  onClose?: () => void;
  onCollapse?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-white flex-shrink-0">
        <Link href="/" onClick={onClose} className="hover:opacity-90 transition">
          <Logo size="md" />
        </Link>
        <div className="flex items-center gap-1">
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
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
                        ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors flex-shrink-0',
                          isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex-shrink-0">
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
      </div>
    </>
  );
}

export function Sidebar() {
  const { isOpen, close, isCollapsed, toggleCollapsed } = useMobileNav();

  return (
    <>
      {/* Desktop Persistent / Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex w-64 border-r border-slate-200 bg-white flex-col fixed inset-y-0 left-0 z-20 transition-transform duration-300 ease-in-out shadow-xs',
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        )}
      >
        <NavContent onCollapse={toggleCollapsed} />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Off-Canvas Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl transition-transform duration-200 ease-in-out border-r border-slate-200',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent onClose={close} />
      </div>
    </>
  );
}
