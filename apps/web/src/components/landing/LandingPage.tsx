'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Copy,
  ChevronDown,
  Shield,
  Zap,
  Server,
  Key,
  Lock,
  Radio,
  FileCode2,
  Menu,
  X,
  Mail,
  Sparkles,
  Terminal,
  Activity,
  Layers,
  Gauge,
  Coins,
  RefreshCw,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { LandingThreeGate } from './LandingThreeGate';
import { Show, UserButton } from '@clerk/nextjs';

function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function XSocialIcon({ className = "w-4 h-4" }: { className?: string }) {
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

  // Hero Quick-Install Pill State
  const [installTab, setInstallTab] = useState<'npm' | 'pnpm' | 'pip'>('npm');
  const [copiedInstall, setCopiedInstall] = useState(false);

  // Interactive Live Circuit Breaker Simulation State
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
    setSimStep(1); // Simulating primary 429
    setTimeout(() => {
      setSimStep(2); // Failed over to Gemini in 142ms
      setTimeout(() => {
        setSimulating(false);
      }, 1500);
    }, 600);
  };

  const codeSnippets = {
    typescript: `// npm install tanvelo
import { Tanvelo } from "tanvelo";

const tanvelo = new Tanvelo({
  apiKey: process.env.TANVELO_API_KEY, // or "tv_live_..."
});

// Call any model with automated multi-provider fallback failover
const stream = await tanvelo.chat.completions.create({
  model: "claude-3-5-sonnet",
  fallbacks: ["gemini-1.5-pro", "deepseek-chat", "gpt-4o"],
  messages: [{ role: "user", content: "Ship to production with zero downtime." }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`,
    python: `# pip install tanvelo
from tanvelo import Tanvelo

client = Tanvelo(
    api_key="tv_live_948f2b...", # or TANVELO_API_KEY env var
)

# Route requests with sub-180ms intelligent provider fallbacks
stream = client.chat.completions.create(
    model="claude-3-5-sonnet",
    fallbacks=["gemini-1.5-pro", "deepseek-chat", "gpt-4o"],
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
      a: 'The Tanvelo Official SDK (available as "tanvelo" for TypeScript/Node.js and Python) is a purpose-built, high-performance client library. It provides native support for multi-provider automatic fallbacks, Server-Sent Events (SSE) streaming, token metering, and latency tracking with zero external dependencies.',
    },
    {
      q: 'How does the sub-180ms fallback circuit breaker work?',
      a: 'When an upstream provider experiences a rate limit (HTTP 429), gateway timeout (504), or server outage (500/502/503), Tanvelo immediately redirects in-flight requests to your next configured fallback model (e.g. Claude to Gemini or DeepSeek) without breaking your client connection or terminating active streaming SSE chunks.',
    },
    {
      q: 'Can I enforce hard monthly budget caps and rate limits?',
      a: 'Yes. Tanvelo includes atomic Redis-backed token-bucket rate limiters (RPM/TPM) and project-level monthly budget ceilings. If autonomous agents enter runaway recursive loops, hard cutoffs prevent catastrophic billing surges by returning standard 429 responses.',
    },
    {
      q: 'Does Tanvelo retain prompt contents or responses?',
      a: 'No. Tanvelo operates under a strict Zero Body Retention policy. Payloads are processed and streamed in-flight and never stored on disk. Only auditable operational metadata (latency waterfall, token counts, dollar-accurate costs, status codes) is recorded in the ledger.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-slate-900 font-semibold tracking-tight text-lg">
            <img src="/assets/logo.svg" alt="Tanvelo Logo" className="w-6 h-6" />
            <span>tanvelo</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#difference" className="hover:text-slate-900 transition-colors">Architecture</a>
            <a href="#capabilities" className="hover:text-slate-900 transition-colors">Capabilities</a>
            <a href="#failover-demo" className="hover:text-slate-900 transition-colors">Live Failover</a>
            <a href="#quickstart" className="hover:text-slate-900 transition-colors">SDK Quickstart</a>
            <a href="#trust" className="hover:text-slate-900 transition-colors">Security</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
            <Link href="/docs" className="hover:text-slate-900 transition-colors font-semibold text-sky-600">
              Docs &amp; SDK
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="hidden sm:inline-flex items-center justify-center h-9 px-3.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center h-9 px-3.5 sm:px-4 text-xs font-medium bg-slate-900 hover:bg-black text-white rounded-full transition-all shadow-sm hover:shadow"
              >
                Get Started
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/overview"
                className="inline-flex items-center justify-center h-9 px-3.5 sm:px-4 text-xs font-medium bg-slate-900 hover:bg-black text-white rounded-full transition-all shadow-sm hover:shadow"
              >
                Dashboard
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-1 ring-slate-200',
                  },
                }}
              />
            </Show>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-5 py-4 space-y-3 shadow-lg">
            <div className="space-y-1">
              <a
                href="#difference"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
              >
                Architecture
              </a>
              <a
                href="#capabilities"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
              >
                Capabilities
              </a>
              <a
                href="#failover-demo"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
              >
                Live Failover Demo
              </a>
              <a
                href="#quickstart"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
              >
                Official SDK Quickstart
              </a>
              <a
                href="#trust"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
              >
                Security &amp; Trust
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
              >
                Contact Us
              </a>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-3 py-2 rounded-lg transition"
              >
                Official SDK &amp; API Docs &rarr;
              </Link>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Show when="signed-out">
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full py-2 text-sm font-medium text-white bg-slate-900 hover:bg-black rounded-lg transition"
                >
                  Get Started
                </Link>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/overview"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full py-2 text-sm font-medium text-white bg-slate-900 hover:bg-black rounded-lg transition"
                >
                  Open Dashboard
                </Link>
              </Show>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-3">
              <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
                Privacy Policy
              </Link>
              <span>·</span>
              <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
                Terms of Service
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-10 pb-12 sm:pt-16 sm:pb-16 md:pt-20 md:pb-20 overflow-hidden border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            {/* Official SDK Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-mono font-medium mb-5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Official Tanvelo SDK for TypeScript &amp; Python</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.04em] text-slate-900 leading-[1.05] mb-4 sm:mb-5">
              The Unified LLM Gateway<span className="text-sky-500">.</span><br />
              One Official SDK<span className="text-sky-500">.</span><br />
              Zero Downtime<span className="text-sky-500">.</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6 sm:mb-7 max-w-lg mx-auto lg:mx-0">
              Build resilient AI systems with the official Tanvelo SDK (<code className="text-sky-700 font-mono text-xs sm:text-sm bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">tanvelo</code>). Route seamlessly across Anthropic Claude, Google Gemini, DeepSeek, Groq, Mistral, Ollama, and OpenAI with sub-180ms deterministic fallbacks, atomic rate limits, and live telemetry.
            </p>

            {/* Interactive 1-Click Install Selector */}
            <div className="mb-6 p-2 bg-slate-900 border border-slate-800 rounded-xl max-w-md mx-auto lg:mx-0 flex items-center justify-between text-xs font-mono text-slate-100 shadow-sm">
              <div className="flex items-center gap-1.5">
                {(['npm', 'pnpm', 'pip'] as const).map((pkg) => (
                  <button
                    key={pkg}
                    onClick={() => setInstallTab(pkg)}
                    className={`px-2 py-1 rounded transition ${
                      installTab === pkg
                        ? 'bg-slate-800 text-white font-semibold border border-slate-700'
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
                {copiedInstall ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-900 hover:bg-black text-white text-sm font-medium transition-all shadow-sm hover:shadow"
              >
                <span>Explore Official SDK &amp; Docs</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/overview"
                className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium border border-slate-200 transition-all shadow-2xs"
              >
                Open Dashboard
              </Link>
            </div>

            {/* Trust Badges Focused on Tanvelo SDK */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs font-mono text-slate-400">
              <span className="text-slate-600 font-medium">Official TypeScript &amp; Python SDKs</span>
              <span>·</span>
              <span>Sub-180ms Failover</span>
              <span>·</span>
              <span>Streaming SSE Native</span>
              <span>·</span>
              <span>Zero External Dependencies</span>
            </div>
          </div>

          {/* 3D Canvas Visual with Official SDK Overlay */}
          <div className="relative w-full h-[320px] sm:h-[400px] md:h-[480px] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50/50 border border-slate-100">
            <LandingThreeGate />

            {/* Subtle Overlay Chip */}
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:left-4 sm:bottom-4 bg-white/95 border border-slate-200/90 rounded-xl p-3 shadow-md backdrop-blur-sm pointer-events-none font-mono text-[10px] sm:text-xs">
              <div className="text-slate-800 flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Official Tanvelo SDK • Multi-provider in one runtime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provider Ecosystem Strip (Moving Horizontally) */}
      <section className="py-4 bg-slate-50/80 border-b border-slate-100 overflow-hidden relative" aria-label="Supported Providers">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-4">
          <div className="shrink-0 flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap">
              ONE API · 10+ PROVIDERS &amp; LOCAL MODELS
            </span>
          </div>

          <div className="flex-1 w-full overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="animate-marquee flex items-center gap-8 py-1">
              {[...PROVIDERS, ...PROVIDERS].map((provider, idx) => (
                <div key={idx} className="flex items-center gap-3 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500/70" />
                  <span className="text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors whitespace-nowrap">
                    {provider}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 hidden lg:flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full font-mono text-xs text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Official Tanvelo SDK (TS &amp; Python)</span>
          </div>
        </div>
      </section>

      {/* Interactive Circuit Breaker & Failover Simulation Section (NEW ATTRACTIVE FEATURE) */}
      <section id="failover-demo" className="py-20 md:py-24 border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="font-mono text-xs uppercase tracking-wider text-sky-600 font-semibold mb-3">
            Interactive Circuit Breaker Visualizer
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-slate-900 mb-3">
                Watch sub-180ms automated fallback in real time.
              </h2>
              <p className="text-slate-600 text-base md:text-lg max-w-2xl">
                When upstream providers experience rate limits (HTTP 429) or cloud downtime, Tanvelo executes deterministic circuit breakers to sustain production traffic.
              </p>
            </div>

            <button
              onClick={runFailoverSimulation}
              disabled={simulating}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-mono font-medium transition shadow-xs self-start md:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
              <span>{simulating ? 'Executing Failover...' : 'Simulate Upstream 429 Outage'}</span>
            </button>
          </div>

          {/* Interactive Simulation Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1: Ingress */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400 font-medium">01 / INGRESS</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Client Request</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-mono">
                tanvelo.chat.completions.create(model=&quot;gpt-4o&quot;, fallbacks=[&quot;claude-3-5-sonnet&quot;, &quot;gemini-1.5-pro&quot;])
              </p>
              <div className="pt-2 text-[11px] text-slate-400 font-mono">
                Incoming streaming connection open
              </div>
            </div>

            {/* Step 2: Upstream Primary Outage */}
            <div className={`p-6 rounded-2xl transition-all duration-300 border shadow-2xs space-y-3 ${
              simStep === 1
                ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-200'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-rose-600">02 / CIRCUIT BREAKER</span>
                {simStep === 1 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-200 text-rose-800 font-bold animate-pulse">
                    429 RATE LIMIT
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                )}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Primary Attempt (gpt-4o)</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-mono">
                {simStep === 1
                  ? 'Upstream returned 429 Too Many Requests. Instant circuit breaker triggered.'
                  : 'Monitors upstream latency and HTTP response status codes.'}
              </p>
              <div className="pt-2 text-[11px] text-rose-600 font-mono">
                {simStep >= 1 ? 'Failover triggered in 14ms' : 'Normal state'}
              </div>
            </div>

            {/* Step 3: Automated Failover Success */}
            <div className={`p-6 rounded-2xl transition-all duration-300 border shadow-2xs space-y-3 ${
              simStep === 2
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-emerald-600">03 / FAILOVER ROUTED</span>
                {simStep === 2 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-200 text-emerald-800 font-bold">
                    200 OK (142ms)
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                )}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Fulfilled by Claude 3.5 Sonnet</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-mono">
                {simStep === 2
                  ? 'Response delivered with zero dropped tokens or client disconnection.'
                  : 'Ordered secondary models take over transparently.'}
              </p>
              <div className="pt-2 text-[11px] text-emerald-600 font-mono">
                {simStep === 2 ? 'Total failover latency: 142ms' : 'Ready'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 01 / Problem vs Solution */}
      <section id="difference" className="py-20 md:py-28 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="font-mono text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">
            01 / The Problem
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-slate-900 mb-4">
            Provider sprawl is a reliability problem.
          </h2>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mb-12">
            Multiple provider SDKs mean fragmented keys, silent 429 cascades, and unexpected invoices. Tanvelo consolidates everything into one controlled path with its official SDK.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without */}
            <div className="p-7 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs font-semibold text-rose-600 tracking-wider mb-5">
                  WITHOUT TANVELO
                </div>
                <ul className="space-y-4 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span><strong className="text-slate-900">Silent 429 Failures:</strong> Upstream rate limits crash client requests without a backup path.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span><strong className="text-slate-900">Fragmented SDKs &amp; Keys:</strong> Juggling separate libraries, tokenizers, error formats, and API keys.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span><strong className="text-slate-900">Uncapped Spend:</strong> Autonomous agent runaway loops discovered days later on provider billing dashboards.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* With */}
            <div className="p-7 rounded-2xl border border-slate-300 bg-slate-50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs font-semibold text-sky-600 tracking-wider mb-5">
                  WITH TANVELO &amp; OFFICIAL SDK
                </div>
                <ul className="space-y-4 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                    <span><strong className="text-slate-900">184ms Automated Failover:</strong> Rate limits and 5xx errors automatically fail over to Claude or Gemini.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                    <span><strong className="text-slate-900">Official Tanvelo SDK:</strong> Zero-dependency typed clients (<code className="text-sky-700 font-mono">tanvelo</code>) for TypeScript and Python.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                    <span><strong className="text-slate-900">Atomic Limits &amp; Budgets:</strong> Enforce strict spend caps with standard <code>X-RateLimit</code> headers.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 / Capabilities */}
      <section id="capabilities" className="py-20 md:py-28 bg-slate-50/60 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="font-mono text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">
            02 / Capabilities
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-slate-900 mb-4">
            Production controls, not an opaque proxy.
          </h2>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mb-12">
            Fundamental architectural capabilities engineered for teams shipping mission-critical LLMs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl border border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 transition-transform">
              <span className="font-mono text-xs text-sky-600 font-medium block mb-4">01</span>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Deterministic Routing</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Declare primary models, retries, and ordered fallbacks per project. Tanvelo executes deterministic rules — never an unpredictable black box.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 transition-transform">
              <span className="font-mono text-xs text-sky-600 font-medium block mb-4">02</span>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Atomic Redis Limits</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Token-bucket rate limits per key and project. Hard monthly budget cutoffs prevent recursive agent loops from draining capital.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 transition-transform">
              <span className="font-mono text-xs text-sky-600 font-medium block mb-4">03</span>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Request Audit Ledger</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every request records an auditable trail: latency waterfall, upstream attempt status, token metrics, and dollar-accurate estimated costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Matrix (NEW ATTRACTIVE FEATURE) */}
      <section className="py-20 md:py-24 border-b border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="font-mono text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">
            Comparison Matrix
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-slate-900 mb-4">
            Why teams choose Tanvelo.
          </h2>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mb-10">
            Compare building directly against multiple raw provider APIs versus using Tanvelo&apos;s unified control plane.
          </p>

          <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-mono text-xs">
                  <th className="p-4 sm:p-5">Feature</th>
                  <th className="p-4 sm:p-5 text-rose-700">Raw Provider APIs</th>
                  <th className="p-4 sm:p-5 bg-sky-50 text-sky-900 font-bold">Tanvelo Gateway &amp; Official SDK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Automatic Fallback on 429 / Outage</td>
                  <td className="p-4 sm:p-5 text-rose-600">Crashes client request</td>
                  <td className="p-4 sm:p-5 bg-sky-50/50 font-semibold text-emerald-700 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Sub-180ms failover without dropped stream</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">SDK Packaging Overhead</td>
                  <td className="p-4 sm:p-5 text-slate-500">3-5 heavy SDK dependencies</td>
                  <td className="p-4 sm:p-5 bg-sky-50/50 font-semibold text-slate-900">Single zero-dependency client (<code className="font-mono text-sky-700">tanvelo</code>)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Rate Limiting</td>
                  <td className="p-4 sm:p-5 text-slate-500">Uncontrolled upstream rejections</td>
                  <td className="p-4 sm:p-5 bg-sky-50/50 font-semibold text-slate-900">Distributed Redis token-buckets (RPM/TPM)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Monthly Hard Spend Protection</td>
                  <td className="p-4 sm:p-5 text-rose-600">None (runaway agent risk)</td>
                  <td className="p-4 sm:p-5 bg-sky-50/50 font-semibold text-emerald-700 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Automated hard spend caps &amp; webhook alerts</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Request Audit &amp; Cost Metering</td>
                  <td className="p-4 sm:p-5 text-slate-500">Scattered provider consoles</td>
                  <td className="p-4 sm:p-5 bg-sky-50/50 font-semibold text-slate-900">Real-time ledger with dollar-accurate token costs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 03 / Quickstart */}
      <section id="quickstart" className="py-20 md:py-28 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="font-mono text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">
            03 / Quickstart
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-slate-900 mb-4">
            From zero to first request in 60 seconds.
          </h2>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mb-8">
            Official Tanvelo SDK for TypeScript &amp; Python. Intelligent multi-provider routing, instant fallback failover, and zero config.
          </p>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-xl max-w-3xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {(['typescript', 'python', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveTab(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      activeTab === lang
                        ? 'bg-slate-800 text-white font-medium border border-slate-700 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'typescript'
                      ? 'TypeScript (tanvelo)'
                      : lang === 'python'
                      ? 'Python (tanvelo)'
                      : 'cURL / REST'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-6 font-mono text-xs md:text-sm text-slate-300 overflow-x-auto leading-relaxed">
              <code>{codeSnippets[activeTab]}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* 04 / Security */}
      <section id="trust" className="py-20 md:py-28 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="font-mono text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">
            04 / Security
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-slate-900 mb-4">
            Guardrails you can inspect.
          </h2>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mb-12">
            Security is not a badge at the bottom of the page. It is a verifiable set of architectural controls.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
              <Key className="w-5 h-5 text-sky-600 mb-3" />
              <div className="font-semibold text-slate-900 text-sm mb-1">Gateway Keys</div>
              <p className="text-slate-600 text-xs leading-relaxed">Cryptographically random, displayed once, stored exclusively as SHA-256 hashes.</p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
              <Lock className="w-5 h-5 text-sky-600 mb-3" />
              <div className="font-semibold text-slate-900 text-sm mb-1">Provider Secrets</div>
              <p className="text-slate-600 text-xs leading-relaxed">Master keys are encrypted at rest with AES-256-GCM. Never exposed to browsers.</p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
              <Radio className="w-5 h-5 text-sky-600 mb-3" />
              <div className="font-semibold text-slate-900 text-sm mb-1">Webhooks &amp; SSRF</div>
              <p className="text-slate-600 text-xs leading-relaxed">HMAC-SHA256 signatures with bounded retries and RFC1918 egress protections.</p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
              <Shield className="w-5 h-5 text-sky-600 mb-3" />
              <div className="font-semibold text-slate-900 text-sm mb-1">Zero Body Retention</div>
              <p className="text-slate-600 text-xs leading-relaxed">Bodies sanitized by default; full body storage is strictly opt-in and off by default.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            <span>Honesty by default: No invented uptime metrics, fake logos, or synthetic charts.</span>
          </div>
        </div>
      </section>

      {/* 05 / FAQ */}
      <section id="faq" className="py-20 md:py-28 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="font-mono text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">
            05 / Questions
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-slate-900 mb-10">
            Common questions.
          </h2>

          <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="py-5">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between text-left font-medium text-slate-900 hover:text-sky-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="font-mono text-lg text-slate-400 ml-4">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-2xl">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 06 / Contact Us (Email, Instagram, and X) */}
      <section id="contact" className="py-20 md:py-28 border-b border-slate-100 bg-slate-50/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="font-mono text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">
            06 / Contact Us
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-slate-900 mb-3">
                Connect with our team.
              </h2>
              <p className="text-slate-600 text-base md:text-lg max-w-xl">
                Have questions about deployment topologies, custom model fallbacks, enterprise SLAs, or integration assistance? We are here to help.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full px-3.5 py-1.5 self-start md:self-auto shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Fast response • Mon-Sat 9AM-8PM IST
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Email Card */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-medium mb-1">
                  Email
                </div>
                <div className="font-semibold text-slate-900 text-sm mb-1 break-all select-all font-mono">
                  tanvelo@zohomail.in
                </div>
                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  For enterprise inquiries, architecture advice, and security verification.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <a
                  href="mailto:tanvelo@zohomail.in"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium bg-slate-900 hover:bg-black text-white rounded-lg transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('tanvelo@zohomail.in');
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 2000);
                  }}
                  className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition"
                  title="Copy email address"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Instagram Card */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-medium mb-1">
                  Instagram
                </div>
                <div className="font-semibold text-slate-900 text-sm mb-1 font-mono">
                  @tanvelo_in
                </div>
                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  Follow product features, engineering culture, and community spotlights.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <a
                  href="https://instagram.com/tanvelo_in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium border border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 text-slate-800 hover:text-pink-600 rounded-lg transition"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>Follow @tanvelo_in</span>
                </a>
              </div>
            </div>

            {/* X (formerly Twitter) Card */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <XSocialIcon className="w-4 h-4" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-medium mb-1">
                  X (formerly Twitter)
                </div>
                <div className="font-semibold text-slate-900 text-sm mb-1 font-mono">
                  @tanvelo_in
                </div>
                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  Changelogs, gateway benchmarks, and real-time infrastructure releases.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <a
                  href="https://x.com/tanvelo_in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium border border-slate-200 hover:border-slate-400 hover:bg-slate-100 text-slate-800 rounded-lg transition"
                >
                  <XSocialIcon className="w-3.5 h-3.5" />
                  <span>Follow @tanvelo_in</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-slate-900 mb-4">
            Make reliability your default.
          </h2>
          <p className="text-slate-600 text-base mb-8">
            Put every model behind one controlled endpoint in under five minutes with the official Tanvelo SDK.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-900 hover:bg-black text-white text-sm font-medium transition-all shadow-sm hover:shadow"
            >
              <span>Explore Official SDK</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/overview"
              className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium border border-slate-200 transition-all"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Comprehensive Footer (Instagram and X) */}
      <footer className="pt-16 pb-12 border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
            {/* Col 1: Brand & Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-white font-semibold tracking-tight text-lg">
                <img src="/assets/logo.svg" alt="Tanvelo Logo" className="w-6 h-6 brightness-200" />
                <span>tanvelo</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                One controlled endpoint for Anthropic, Google Gemini, DeepSeek, and OpenAI with deterministic routing, atomic rate limits, and real-time telemetry.
              </p>
              <div className="pt-1 text-[11px] font-mono text-slate-500">
                Built for mission-critical LLM infrastructure.
              </div>
            </div>

            {/* Col 2: Platform Links */}
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-slate-200 font-semibold mb-4">
                Platform
              </div>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><a href="#difference" className="hover:text-white transition">Architecture</a></li>
                <li><a href="#capabilities" className="hover:text-white transition">Capabilities</a></li>
                <li><a href="#failover-demo" className="hover:text-white transition">Live Failover</a></li>
                <li><a href="#quickstart" className="hover:text-white transition">Official SDK Quickstart</a></li>
                <li><a href="#trust" className="hover:text-white transition">Security Controls</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
                <li><Link href="/docs" className="hover:text-white transition font-medium text-sky-400">Documentation &amp; SDK</Link></li>
                <li><Link href="/overview" className="hover:text-white transition">Web Dashboard</Link></li>
              </ul>
            </div>

            {/* Col 3: Direct Contact */}
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-slate-200 font-semibold mb-4">
                Contact Us
              </div>
              <ul className="space-y-3.5 text-xs text-slate-400">
                <li>
                  <span className="block text-[11px] font-mono uppercase text-slate-500">Email</span>
                  <a href="mailto:tanvelo@zohomail.in" className="hover:text-white transition text-slate-200 font-mono text-xs flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <span>tanvelo@zohomail.in</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: ONLY Instagram & X (formerly Twitter) + Legal */}
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-slate-200 font-semibold mb-4">
                Social &amp; Community
              </div>
              <ul className="space-y-3 text-xs text-slate-400">
                <li>
                  <a
                    href="https://x.com/tanvelo_in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition text-slate-200"
                  >
                    <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-white">
                      <XSocialIcon className="w-3 h-3" />
                    </span>
                    <span className="font-mono">X: @tanvelo_in</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/tanvelo_in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition text-slate-200"
                  >
                    <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 text-pink-400 flex items-center justify-center">
                      <InstagramIcon className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-mono">Instagram: @tanvelo_in</span>
                  </a>
                </li>
                <li className="pt-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                    <span>•</span>
                    <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <img src="/assets/logo.svg" alt="Tanvelo Logo" className="w-4 h-4 brightness-200" />
              <span className="font-semibold text-slate-300">tanvelo</span>
              <span>© 2026. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Gateway Engine Active
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
