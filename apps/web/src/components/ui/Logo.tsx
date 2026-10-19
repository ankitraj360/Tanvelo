import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const iconDimensions = {
    sm: { w: 22, h: 22, text: 'text-sm' },
    md: { w: 30, h: 30, text: 'text-base' },
    lg: { w: 38, h: 38, text: 'text-lg' },
    xl: { w: 48, h: 48, text: 'text-2xl' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Unique Tanvelo Kinetic Chevron Emblem */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-[#0B0F19] to-slate-950 p-1.5 border border-slate-700/60 shadow-lg shadow-cyan-500/10 group cursor-pointer transition-transform duration-200 hover:scale-105"
        style={{ width: iconDimensions.w + 12, height: iconDimensions.h + 12 }}
      >
        <svg
          width={iconDimensions.w}
          height={iconDimensions.h}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-all duration-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]"
        >
          <defs>
            {/* Primary Cyan-to-Blue Velocity Gradient */}
            <linearGradient id="tv-grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            {/* Electric Violet-Indigo Beam Gradient */}
            <linearGradient id="tv-grad-violet" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="50%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>

            {/* Core Gateway Particle Glow */}
            <radialGradient id="tv-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
              <stop offset="40%" stopColor="#818CF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Left Forward Wave Prism Wing */}
          <path
            d="M 18 20 L 46 20 L 32 80 L 12 80 Z"
            fill="url(#tv-grad-cyan)"
            opacity="0.95"
          />

          {/* Upper Velocity Horizon Bar */}
          <path
            d="M 40 20 L 86 20 L 72 38 L 26 38 Z"
            fill="url(#tv-grad-cyan)"
            opacity="0.85"
          />

          {/* Interlocking Convergent Prism (Right/Bottom) */}
          <path
            d="M 52 44 L 88 44 L 70 80 L 34 80 Z"
            fill="url(#tv-grad-violet)"
            opacity="0.9"
          />

          {/* Center High-Speed Gateway Spark */}
          <circle cx="50" cy="50" r="10" fill="url(#tv-core-glow)" />
          <circle cx="50" cy="50" r="4" fill="#FFFFFF" />
        </svg>

        {/* Ambient Ring Glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-violet-500/10 to-transparent pointer-events-none" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent ${iconDimensions.text}`}
            >
              Tanvelo
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-xs">
              GW
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            LLM Gateway
          </span>
        </div>
      )}
    </div>
  );
}
