'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface NavContextType {
  // Desktop sidebar state
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  toggleCollapsed: () => void;

  // Mobile drawer state
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Unified toggle
  toggleSidebar: () => void;
}

const NavContext = createContext<NavContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleCollapsed: () => {},
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  toggleSidebar: () => {},
});

const STORAGE_KEY = 'tanvelo_sidebar_collapsed';

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsedState] = useState(false);
  const pathname = usePathname();

  // Hydrate collapsed state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsedState(stored === 'true');
      }
    } catch (_) {
      // LocalStorage access may fail in certain browser privacy modes
    }
  }, []);

  const setIsCollapsed = useCallback((val: boolean) => {
    setIsCollapsedState(val);
    try {
      localStorage.setItem(STORAGE_KEY, String(val));
    } catch (_) {}
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (window.innerWidth >= 1024) {
          toggleCollapsed();
        } else {
          setIsOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapsed]);

  // Automatically close mobile sidebar on navigation change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background body scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      toggleCollapsed();
    } else {
      toggle();
    }
  };

  return (
    <NavContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleCollapsed,
        isOpen,
        open,
        close,
        toggle,
        toggleSidebar,
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useMobileNav() {
  return useContext(NavContext);
}

export function useNav() {
  return useContext(NavContext);
}
