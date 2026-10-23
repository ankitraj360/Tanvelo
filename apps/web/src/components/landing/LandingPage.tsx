'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Copy,
  Shield,
  Zap,
  Key,
  Lock,
  Radio,
  Menu,
  X,
  Mail,
  Sparkles,
  Terminal,
  Activity,
  Gauge,
  Coins,
  RefreshCw,
  GitFork,
} from 'lucide-react';
import { LandingThreeGate } from './LandingThreeGate';
import { Show, UserButton } from '@clerk/nextjs';

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function XSocialIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const PROVIDERS = [
  'Anthropic Claude',
  'Google Gemini',
  'DeepSeek R1 / V3',
  'OpenAI',
  'Groq LPU',
  'Mistral AI',
  'Ollama / Local',
  'OpenRouter',
  'Cohere',
];

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<'typescript' | 'python' | 'curl'>('typescript');
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick Install Selector
  const [installTab, setInstallTab] = useState<'npm' | 'pnpm' | 'pip'>('npm');
  const [copiedInstall, setCopiedInstall] = useState(false);

  // Circuit Breaker Simulation
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState<0 | 1 | 2>(0);

  const installCommands = {
    npm: 'npm install tanvelo',
    pnpm: 'pnpm add tanvelo',
    pip: 'pip install tanvelo',
  };

  const handleCopyInstall = async () => {
    try {
      await navigator.clipboard.writeText(installCommands[installTab]);
      setCopiedInstall(true);
      setTimeout(() => setCopiedInstall(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const runFailoverSimulation = () => {
    if (simulating) return;
    setSimulating(true);
    setSimStep(1);
    setTimeout(() => {
      setSimStep(2);
      setTimeout(() => {
        setSimulating(false);
      }, 1500);
    }, 600);
  };

  const codeSnippets = {
    typescript: `import { Tanvelo } from "tanvelo";

const tanvelo = new Tanvelo({
  apiKey: process.env.TANVELO_API_KEY, // "tv_live_..."
});

// Automatic multi-provider fallback failover
const stream = await tanvelo.chat.completions.create({
  model: "claude-3-5-sonnet",
  fallbacks: ["gemini-1.5-pro", "deepseek-chat"],
  messages: [{ role: "user", content: "Ship to production with zero downtime." }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`,
    python: `from tanvelo import Tanvelo

client = Tanvelo(
    api_key="tv_live_...", # or TANVELO_API_KEY env var
)

# Automated sub-180ms multi-provider fallback
stream = client.chat.completions.create(
    model="claude-3-5-sonnet",
    fallbacks=["gemini-1.5-pro", "deepseek-chat"],
    messages=[{"role": "user", "content": "Ship to production with zero downtime."}],
    stream=True,
)

for chunk in stream:
    print(chunk.delta, end="", flush=True)`,
    curl: `curl -X POST https://tanvelo-backend-zgyc.onrender.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $TANVELO_API_KEY" \\
  -d '{
    "model": "claude-3-5-sonnet",
    "fallbacks": ["gemini-1.5-pro", "deepseek-chat"],
    "messages": [{"role": "user", "content": "Ship to production with zero downtime."}],
    "stream": true
  }'`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippets[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const faqs = [
    {
      q: 'What is the Tanvelo Official SDK?',
      a: 'The official Tanvelo SDK (tanvelo on npm and PyPI) is a lightweight, zero-dependency client with native multi-provider fallbacks, Server-Sent Events (SSE) streaming, and real-time latency and cost telemetry.',
    },
    {
      q: 'How does the sub-180ms circuit breaker work?',
      a: 'When an upstream provider returns a 429 rate limit or 5xx outage, Tanvelo immediately re-routes the in-flight request to secondary fallback models without terminating the client connection or dropping active SSE chunks.',
    },
    {
      q: 'Can I enforce rate limits and hard spend caps?',
      a: 'Yes. Tanvelo provides atomic Redis token-bucket rate limiting (RPM/TPM) and project-level monthly budget ceilings that cut off requests before runaway agent loops accumulate cost.',
    },
    {
      q: 'Does Tanvelo store prompt contents or completions?',
      a: 'No. Tanvelo strictly enforces Zero Body Retention. Payloads are processed in-flight and never persisted to disk. Only operational metrics (latency, token usage, cost, status codes) are logged in the ledger.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-slate-900 font-semibold tracking-tight text-base">
            <img src="/assets/logo.svg" alt="Tanvelo" className="w-5 h-5" />
            <span>tanvelo</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600">
            <a href="#architecture" className="hover:text-slate-900 transition-colors">Architecture</a>
            <a href="#capabilities" className="hover:text-slate-900 transition-colors">Capabilities</a>
            <a href="#failover" className="hover:text-slate-900 transition-colors">Circuit Breaker</a>
            <a href="#benchmarks" className="hover:text-slate-900 transition-colors">Comparison</a>
            <a href="#quickstart" className="hover:text-slate-900 transition-colors">Quickstart</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
            <Link href="/docs" className="hover:text-sky-600 transition-colors font-semibold text-slate-900">
              Documentation
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="hidden sm:inline-flex items-center justify-center h-8 px-3.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center h-8 px-4 text-xs font-medium bg-slate-900 hover:bg-black text-white rounded-full transition-all shadow-xs"
              >
                Get Started
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/overview"
                className="inline-flex items-center justify-center h-8 px-4 text-xs font-medium bg-slate-900 hover:bg-black text-white rounded-full transition-all shadow-xs"
              >
                Dashboard
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-7 h-7 rounded-full ring-1 ring-slate-200',
                  },
                }}
              />
            </Show>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-600 hover:text-slate-900 md:hidden transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-5 py-4 space-y-3 shadow-lg">
            <div className="space-y-1 text-sm font-medium text-slate-700">
              <a href="#architecture" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
                Architecture
              </a>
              <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
                Capabilities
              </a>
              <a href="#failover" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
                Circuit Breaker
              </a>
              <a href="#benchmarks" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
                Comparison
              </a>
              <a href="#quickstart" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
                Quickstart
              </a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
                Contact
              </a>
              <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sky-600 font-semibold hover:bg-sky-50">
                Documentation &amp; SDK &rarr;
              </Link>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">Privacy</Link>
              <span>·</span>
              <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">Terms</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-100 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              <span>Official Tanvelo SDK for TypeScript &amp; Python</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.035em] text-slate-900 leading-[1.08] mb-5">
              Every model.<br />
              One official SDK.<br />
              Zero downtime.
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-7 max-w-lg mx-auto lg:mx-0">
              Route Anthropic Claude, Google Gemini, DeepSeek, and custom models through a single typed client. Automated sub-180ms failover, atomic Redis rate limits, and real-time cost telemetry.
            </p>

            {/* Quick Install Pill */}
            <div className="mb-6 p-1.5 bg-slate-950 border border-slate-800 rounded-xl max-w-sm mx-auto lg:mx-0 flex items-center justify-between text-xs font-mono text-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 pl-1">
                {(['npm', 'pnpm', 'pip'] as const).map((pkg) => (
                  <button
                    key={pkg}
                    onClick={() => setInstallTab(pkg)}
                    className={`px-2 py-0.5 rounded text-[11px] transition ${
                      installTab === pkg
                        ? 'bg-slate-800 text-white font-medium border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pkg}
                  </button>
                ))}
                <span className="text-slate-500 pl-1">$</span>
                <span className="text-sky-300 font-medium select-all">{installCommands[installTab]}</span>
              </div>

              <button
                onClick={handleCopyInstall}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                title="Copy install command"
              >
                {copiedInstall ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Hero Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-xs"
              >
                <span>Read Documentation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/overview"
                className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium border border-slate-200 transition-all"
              >
                Open Dashboard
              </Link>
            </div>

            {/* Muted Highlights */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs font-mono text-slate-400">
              <span>TypeScript &amp; Python</span>
              <span>·</span>
              <span>Sub-180ms Failover</span>
              <span>·</span>
              <span>Native SSE</span>
              <span>·</span>
              <span>Zero Dependencies</span>
            </div>
          </div>

          {/* 3D Visual */}
          <div className="relative w-full h-[320px] sm:h-[400px] md:h-[460px] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50/50 border border-slate-100">
            <LandingThreeGate />

            <div className="absolute bottom-4 left-4 bg-white/95 border border-slate-200 rounded-xl px-3 py-2 shadow-xs backdrop-blur-sm pointer-events-none font-mono text-xs">
              <div className="text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Tanvelo Gateway Engine Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provider Marquee Strip */}
      <section className="py-3.5 bg-slate-50/70 border-b border-slate-100 overflow-hidden" aria-label="Supported Providers">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 font-medium shrink-0">
            Supported Models
          </span>

          <div className="flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="animate-marquee flex items-center gap-8">
              {[...PROVIDERS, ...PROVIDERS].map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 shrink-0 text-xs font-medium text-slate-600 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500/70" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Architecture: Before vs After */}
      <section id="architecture" className="py-20 md:py-24 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-600 font-semibold block mb-2">
              Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-slate-900 mb-3">
              Provider sprawl is a reliability risk.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Managing disparate provider libraries leads to unhandled rate limits and billing exposure. Tanvelo consolidates all workloads into one resilient gateway.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Direct APIs */}
            <div className="p-7 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
              <div className="font-mono text-xs font-semibold text-rose-600 tracking-wider">
                RAW DIRECT PROVIDER APIS
              </div>
              <ul className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">Cascading 429 Failures:</strong> Provider rate limits immediately break active client connections.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">Fragmented SDKs:</strong> Juggling separate authentication keys, tokenizers, and error formats.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">Runaway Spend:</strong> Autonomous agents loop without hard cutoff safeguards, incurring unexpected costs.</span>
                </li>
              </ul>
            </div>

            {/* With Tanvelo */}
            <div className="p-7 rounded-2xl border border-slate-300 bg-slate-50/70 shadow-2xs space-y-4">
              <div className="font-mono text-xs font-semibold text-sky-600 tracking-wider">
                TANVELO GATEWAY &amp; OFFICIAL SDK
              </div>
              <ul className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">Sub-180ms Automated Fallback:</strong> Upstream rate limits immediately shift to secondary models without dropped streams.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">Official Typed SDK:</strong> Single zero-dependency client (<code className="font-mono text-sky-700">tanvelo</code>) for TypeScript and Python.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">Atomic Spend Controls:</strong> Redis-backed token buckets (RPM/TPM) and monthly hard budget ceilings.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Circuit Breaker Visualizer */}
      <section id="failover" className="py-20 md:py-24 border-b border-slate-100 bg-slate-50/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-600 font-semibold block mb-2">
                Circuit Breaker
              </span>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 mb-2">
                Sub-180ms automated fallback in real time.
              </h2>
              <p className="text-slate-600 text-sm max-w-xl">
                When upstream providers return rate limits or outages, Tanvelo executes deterministic circuit breakers to sustain production traffic.
              </p>
            </div>

            <button
              onClick={runFailoverSimulation}
              disabled={simulating}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-mono font-medium transition shadow-xs self-start md:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
              <span>{simulating ? 'Rerouting...' : 'Simulate Upstream 429 Outage'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>01 / INGRESS</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h3 className="font-semibold text-slate-900 text-xs">Client Request Initiated</h3>
              <p className="text-xs text-slate-500 font-mono">
                model: &quot;gpt-4o&quot;, fallbacks: [&quot;claude-3-5-sonnet&quot;]
              </p>
              <div className="text-[11px] text-slate-400 font-mono pt-1">
                Active SSE connection maintained
              </div>
            </div>

            <div className={`p-5 rounded-xl border shadow-2xs space-y-2 transition-all ${
              simStep === 1 ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-600 font-medium">02 / CIRCUIT BREAKER</span>
                {simStep === 1 ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-200 text-rose-800 font-bold">
                    429 RATE LIMIT
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <h3 className="font-semibold text-slate-900 text-xs">Primary Provider Fails</h3>
              <p className="text-xs text-slate-500 font-mono">
                {simStep === 1 ? '429 quota reached. Instant circuit breaker tripped.' : 'Monitors upstream HTTP status.'}
              </p>
              <div className="text-[11px] text-rose-600 font-mono pt-1">
                {simStep >= 1 ? 'Failover triggered in 14ms' : 'Normal state'}
              </div>
            </div>

            <div className={`p-5 rounded-xl border shadow-2xs space-y-2 transition-all ${
              simStep === 2 ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-600 font-medium">03 / COMPLETED</span>
                {simStep === 2 ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-200 text-emerald-800 font-bold">
                    200 OK (142ms)
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <h3 className="font-semibold text-slate-900 text-xs">Fulfilled by Claude 3.5 Sonnet</h3>
              <p className="text-xs text-slate-500 font-mono">
                {simStep === 2 ? 'Delivered with 0 dropped tokens to client.' : 'Secondary model takes over seamlessly.'}
              </p>
              <div className="text-[11px] text-emerald-600 font-mono pt-1">
                {simStep === 2 ? 'Total latency: 142ms' : 'Ready'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section id="capabilities" className="py-20 md:py-24 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-600 font-semibold block mb-2">
              Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-slate-900 mb-3">
              Engineered for production control.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Three architectural pillars designed for teams shipping mission-critical LLM features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <GitFork className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Deterministic Routing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure primary models and prioritized fallbacks per environment. Tanvelo follows deterministic rules — never an unpredictable black box.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Gauge className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Atomic Redis Limiter</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Distributed token-bucket rate limits per API key. Monthly spend caps prevent recursive agent loops from draining funds.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Request Audit Ledger</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every request logs an auditable trace: latency waterfall, upstream attempt history, token counts, and dollar-accurate costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix */}
      <section id="benchmarks" className="py-20 md:py-24 border-b border-slate-100 bg-slate-50/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-600 font-semibold block mb-2">
              Comparison
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 mb-3">
              Direct APIs vs Tanvelo.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Why engineering teams migrate from scattered provider SDKs to Tanvelo&apos;s unified control plane.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-mono">
                  <th className="p-4">Capability</th>
                  <th className="p-4 text-slate-500">Direct Provider APIs</th>
                  <th className="p-4 bg-sky-50/50 text-sky-900 font-semibold">Tanvelo Gateway &amp; Official SDK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-4 font-medium">Automatic Fallback on 429 Outage</td>
                  <td className="p-4 text-slate-500">Crashes client request</td>
                  <td className="p-4 bg-sky-50/30 text-emerald-700 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sub-180ms seamless failover</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">SDK Client Footprint</td>
                  <td className="p-4 text-slate-500">Multiple heavy dependencies</td>
                  <td className="p-4 bg-sky-50/30 font-semibold text-slate-900">Single zero-dependency client (<code className="font-mono text-sky-700">tanvelo</code>)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Distributed Rate Limiting</td>
                  <td className="p-4 text-slate-500">Uncontrolled upstream rejections</td>
                  <td className="p-4 bg-sky-50/30 font-semibold text-slate-900">Atomic Redis token buckets (RPM/TPM)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Hard Monthly Spend Safeguards</td>
                  <td className="p-4 text-slate-500">None (unbudgeted spend risk)</td>
                  <td className="p-4 bg-sky-50/30 text-emerald-700 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hard limits &amp; warning alerts</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Telemetry &amp; Cost Metering</td>
                  <td className="p-4 text-slate-500">Scattered across vendor portals</td>
                  <td className="p-4 bg-sky-50/30 font-semibold text-slate-900">Unified audit ledger with dollar-accurate costs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Developer Quickstart */}
      <section id="quickstart" className="py-20 md:py-24 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-600 font-semibold block mb-2">
              Developer Quickstart
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 mb-3">
              First request in 60 seconds.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Official SDKs for TypeScript and Python. Complete typed interfaces, streaming SSE, and zero configuration.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-lg max-w-3xl mx-auto">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                {(['typescript', 'python', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveTab(lang)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                      activeTab === lang
                        ? 'bg-slate-800 text-white font-medium border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'typescript' ? 'TypeScript' : lang === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded hover:bg-slate-800 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="p-5 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
              <code>{codeSnippets[activeTab]}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Security Controls */}
      <section id="trust" className="py-20 md:py-24 border-b border-slate-100 bg-slate-50/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-600 font-semibold block mb-2">
              Security
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 mb-3">
              Verifiable architectural guardrails.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Engineered with strict access boundaries and zero data retention by default.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
              <Key className="w-4 h-4 text-sky-600 mb-2" />
              <div className="font-semibold text-slate-900 text-xs">Gateway API Keys</div>
              <p className="text-slate-600 text-xs leading-normal">Displayed once upon creation, stored strictly as SHA-256 hashes.</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
              <Lock className="w-4 h-4 text-sky-600 mb-2" />
              <div className="font-semibold text-slate-900 text-xs">Provider Secrets</div>
              <p className="text-slate-600 text-xs leading-normal">Encrypted at rest with server-side AES-256-GCM. Never exposed client-side.</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
              <Radio className="w-4 h-4 text-sky-600 mb-2" />
              <div className="font-semibold text-slate-900 text-xs">SSRF Protection</div>
              <p className="text-slate-600 text-xs leading-normal">HMAC-SHA256 signatures with loopback and RFC1918 egress protections.</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
              <Shield className="w-4 h-4 text-sky-600 mb-2" />
              <div className="font-semibold text-slate-900 text-xs">Zero Body Retention</div>
              <p className="text-slate-600 text-xs leading-normal">Prompts and completions stream in-flight and are never stored on disk.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-24 border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-600 font-semibold block mb-2">
              FAQ
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
              Frequently asked questions.
            </h2>
          </div>

          <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="py-4">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between text-left text-sm font-medium text-slate-900 hover:text-sky-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="font-mono text-base text-slate-400 ml-4">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-24 border-b border-slate-100 bg-slate-50/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-600 font-semibold block mb-2">
              Contact
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 mb-2">
              Direct engineering support.
            </h2>
            <p className="text-slate-600 text-sm">
              Questions regarding integration, custom topologies, or enterprise limits? Reach out directly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {/* Email */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400">Email</div>
                <div className="text-xs font-semibold text-slate-900 font-mono mt-0.5">tanvelo@zohomail.in</div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="mailto:tanvelo@zohomail.in"
                  className="flex-1 text-center py-1.5 px-3 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-black transition"
                >
                  Send Email
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('tanvelo@zohomail.in');
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 2000);
                  }}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                  title="Copy email"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Instagram */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                <InstagramIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400">Instagram</div>
                <div className="text-xs font-semibold text-slate-900 font-mono mt-0.5">@tanvelo_in</div>
              </div>
              <a
                href="https://instagram.com/tanvelo_in"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-1.5 px-3 rounded-lg border border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 text-slate-800 text-xs font-medium transition"
              >
                Follow @tanvelo_in
              </a>
            </div>

            {/* X */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <XSocialIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400">X (Twitter)</div>
                <div className="text-xs font-semibold text-slate-900 font-mono mt-0.5">@tanvelo_in</div>
              </div>
              <a
                href="https://x.com/tanvelo_in"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-1.5 px-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-100 text-slate-800 text-xs font-medium transition"
              >
                Follow @tanvelo_in
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final Action CTA */}
      <section className="py-20 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-slate-900 mb-3">
            Build on resilient AI infrastructure.
          </h2>
          <p className="text-slate-600 text-sm mb-7">
            Deploy every model behind one controlled endpoint in under five minutes.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-xs"
            >
              <span>Explore Official SDK</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/overview"
              className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium border border-slate-200 transition-all"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Refined Minimal Dark Footer */}
      <footer className="pt-14 pb-10 border-t border-slate-200 bg-[#0B0F17] text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold tracking-tight text-sm">
                <img src="/assets/logo.svg" alt="Tanvelo" className="w-5 h-5 brightness-200" />
                <span>tanvelo</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The unified LLM gateway for Claude, Gemini, DeepSeek, and custom models with deterministic fallbacks and atomic telemetry.
              </p>
            </div>

            {/* Col 2: Platform */}
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-slate-200 font-semibold mb-3">
                Platform
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#architecture" className="hover:text-white transition">Architecture</a></li>
                <li><a href="#capabilities" className="hover:text-white transition">Capabilities</a></li>
                <li><a href="#failover" className="hover:text-white transition">Circuit Breaker</a></li>
                <li><a href="#benchmarks" className="hover:text-white transition">Comparison</a></li>
                <li><a href="#quickstart" className="hover:text-white transition">Quickstart</a></li>
                <li><Link href="/docs" className="hover:text-white transition text-sky-400">Documentation</Link></li>
              </ul>
            </div>

            {/* Col 3: Direct Contact */}
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-slate-200 font-semibold mb-3">
                Contact
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="mailto:tanvelo@zohomail.in" className="hover:text-white transition text-slate-300 font-mono flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <span>tanvelo@zohomail.in</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Community & Social */}
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-slate-200 font-semibold mb-3">
                Community
              </div>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <a href="https://x.com/tanvelo_in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition text-slate-300">
                    <XSocialIcon className="w-3.5 h-3.5" />
                    <span>X: @tanvelo_in</span>
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/tanvelo_in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition text-slate-300">
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>Instagram: @tanvelo_in</span>
                  </a>
                </li>
                <li className="pt-2 flex items-center gap-3 text-[11px] text-slate-400">
                  <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
                  <span>·</span>
                  <Link href="/terms" className="hover:text-white transition">Terms</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>&copy; 2026 Tanvelo. All rights reserved.</div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Gateway Engine Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
