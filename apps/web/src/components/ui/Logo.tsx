import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const iconDimensions = {
    sm: { w: 20, h: 20, text: 'text-sm' },
    md: { w: 26, h: 26, text: 'text-base font-semibold' },
    lg: { w: 32, h: 32, text: 'text-lg font-semibold' },
    xl: { w: 42, h: 42, text: 'text-2xl font-bold' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Tanvelo Convergence Gate Mark */}
      <img
        src="/assets/logo.svg"
        alt="Tanvelo Logo"
        width={iconDimensions.w}
        height={iconDimensions.h}
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      />

      {showText && (
        <span className={`tracking-tight text-slate-900 ${iconDimensions.text}`}>
          tanvelo
        </span>
      )}
    </div>
  );
}
