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
} from 'lucide-react';
import { LandingThreeGate } from './LandingThreeGate';
import { Show, UserButton } from '@clerk/nextjs';

function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.979-.276-.1-.476-.15-.676.15-.2.3-.776.98-.952 1.18-.175.2-.351.225-.652.075-.3-.15-1.267-.467-2.414-1.49-1.026-.914-1.72-2.043-1.921-2.388-.201-.345-.021-.532.129-.681.136-.134.301-.351.451-.527.151-.175.201-.3.301-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.63-.927-2.235-.245-.589-.493-.509-.676-.519-.175-.01-.376-.01-.577-.01-.2 0-.527.075-.803.375-.276.3-1.053 1.03-1.053 2.511 0 1.482 1.078 2.912 1.229 3.113.15.2 2.121 3.24 5.138 4.542.718.31 1.278.496 1.716.635.72.229 1.376.197 1.895.12.578-.087 1.78-.727 2.03-1.43.251-.703.251-1.306.175-1.43-.075-.125-.276-.2-.577-.35z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.39A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.584 0-3.08-.456-4.354-1.246l-.312-.193-2.955.825.836-2.88-.21-.334A8.136 8.136 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167 4.503 0 8.167 3.664 8.167 8.167 0 4.503-3.664 8.167-8.167 8.167z" />
    </svg>
  );
}

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
  'OpenAI',
  'Anthropic Claude',
  'Google Gemini',
  'DeepSeek',
  'Groq',
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

  const codeSnippets = {
    typescript: `// npm install @tanvelo/sdk
import { Tanvelo } from "@tanvelo/sdk";

const tanvelo = new Tanvelo({
  apiKey: process.env.TANVELO_API_KEY, // or "tv_live_..."
});

// Call any model with automated multi-provider fallback failover
const stream = await tanvelo.chat.completions.create({
  model: "gpt-4o",
  fallbacks: ["claude-3-5-sonnet", "gemini-1.5-pro", "deepseek-r1"],
  messages: [{ role: "user", content: "Ship to production." }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`,
    python: `# pip install tanvelo
from tanvelo import Tanvelo

tanvelo = Tanvelo(
    api_key="tv_live_948f2b...", # or TANVELO_API_KEY env var
)

# Route requests with sub-180ms intelligent provider fallbacks
stream = tanvelo.chat.completions.create(
    model="gpt-4o",
    fallbacks=["claude-3-5-sonnet", "gemini-1.5-pro", "deepseek-r1"],
    messages=[{"role": "user", "content": "Ship to production."}],
    stream=True,
)

for chunk in stream:
    print(chunk.delta, end="", flush=True)`,
    curl: `curl https://api.tanvelo.in/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $TANVELO_API_KEY" \\
  -d '{
    "model": "gpt-4o",
    "fallbacks": ["claude-3-5-sonnet", "gemini-1.5-pro"],
    "messages": [{"role": "user", "content": "Ship to production."}],
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
      q: 'Is Tanvelo a proxy or a gateway?',
      a: 'A complete API gateway and control plane. It provides unified routing rules, Redis-backed rate limiting, project spend caps, and an auditable request ledger.',
    },
    {
      q: 'Do I have to rewrite my application code?',
      a: 'No. You can use our official SDKs (@tanvelo/sdk for TypeScript or tanvelo for Python) with native fallback support, or point any OpenAI-compatible client to Tanvelo by updating the base URL.',
    },
    {
      q: 'What happens when OpenAI rate-limits (429)?',
      a: 'Tanvelo immediately shifts the in-flight request to your configured fallback provider (Claude or Gemini) within ~180ms without dropping the client connection.',
    },
    {
      q: 'Can I enforce hard monthly budget caps?',
      a: 'Yes. Hard cutoffs reject requests with standard 429 errors when monthly spend thresholds are reached, guarding against recursive agent loops.',
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
            <a href="#quickstart" className="hover:text-slate-900 transition-colors">Quickstart</a>
            <a href="#trust" className="hover:text-slate-900 transition-colors">Security</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
            <Link href="/docs" className="hover:text-slate-900 transition-colors">Docs</Link>
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
                href="#quickstart"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
              >
                Quickstart
              </a>
              <a
                href="#trust"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
              >
                Security & Trust
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
                className="block text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
              >
                API Documentation & SDK
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
      <section className="pt-12 pb-12 sm:pt-16 sm:pb-16 md:pt-24 md:pb-20 overflow-hidden border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.04em] text-slate-900 leading-[1.05] mb-4 sm:mb-5">
              Every model<span className="text-sky-500">.</span><br />
              One gateway<span className="text-sky-500">.</span><br />
              Total control<span className="text-sky-500">.</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0">
              Tanvelo routes OpenAI, Anthropic, Gemini, DeepSeek, Groq, Mistral, Ollama, and custom models through one OpenAI-compatible API — with deterministic fallbacks, atomic rate limits, and auditable telemetry.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
              <a
                href="#quickstart"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-900 hover:bg-black text-white text-sm font-medium transition-all shadow-sm hover:shadow"
              >
                <span>Read the quickstart</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/overview"
                className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium border border-slate-200 transition-all shadow-2xs"
              >
                Open Dashboard
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs font-mono text-slate-400">
              <span>OpenAI SDK Compatible</span>
              <span>·</span>
              <span>Streaming SSE</span>
              <span>·</span>
              <span>Zero SDK Rewrite</span>
            </div>
          </div>

          {/* 3D Canvas Visual (Responsive on all screen heights/widths) */}
          <div className="relative w-full h-[300px] sm:h-[400px] md:h-[480px] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50/50 border border-slate-100">
            <LandingThreeGate />

            {/* Subtle Overlay Chip */}
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:left-4 sm:bottom-4 bg-white/95 border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-md backdrop-blur-sm pointer-events-none font-mono text-[10px] sm:text-xs">
              <div className="text-slate-800 flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Multi-provider in one API</span>
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
              ONE API · 10+ PROVIDERS & LOCAL MODELS
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

          <div className="shrink-0 hidden lg:flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full font-mono text-xs text-slate-600">
            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            <span>OpenAI SDK Compatible</span>
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
            Multiple provider SDKs mean fragmented keys, silent 429 cascades, and unexpected invoices. Tanvelo consolidates everything into one controlled path.
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
                    <span><strong className="text-slate-900">Three Divergent SDKs:</strong> Inconsistent error models, authentication keys, and wrapper glue code.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span><strong className="text-slate-900">Uncapped Spend:</strong> Budget runaway discovered weeks later on provider billing dashboards.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* With */}
            <div className="p-7 rounded-2xl border border-slate-300 bg-slate-50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs font-semibold text-sky-600 tracking-wider mb-5">
                  WITH TANVELO
                </div>
                <ul className="space-y-4 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                    <span><strong className="text-slate-900">184ms Automated Failover:</strong> Rate limits and 5xx errors automatically fail over to Claude or Gemini.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                    <span><strong className="text-slate-900">One Unified Endpoint:</strong> Standard OpenAI SDK drop-in. Change only <code>base_url</code> and key.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                    <span><strong className="text-slate-900">Atomic Limits & Budgets:</strong> Enforce strict spend caps with standard <code>X-RateLimit</code> headers.</span>
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
            Three fundamental capabilities engineered for teams shipping LLMs to real users.
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
                Every request records an auditable trail: latency waterfall, upstream attempt status, token metrics, and estimated costs.
              </p>
            </div>
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
                      ? 'TypeScript (@tanvelo/sdk)'
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
              <div className="font-semibold text-slate-900 text-sm mb-1">Webhooks & SSRF</div>
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

      {/* 06 / Contact Us */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* WhatsApp Card */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <WhatsAppIcon className="w-5 h-5" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-medium mb-1">
                  WhatsApp Support
                </div>
                <div className="font-semibold text-slate-900 text-sm mb-1 font-mono">
                  +91 9771370409
                </div>
                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  Direct instant chat for quick developer troubleshooting and setup assistance.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <a
                  href="https://wa.me/919771370409?text=Hi%20Tanvelo%20team%2C%20I%20would%20like%20to%20learn%20more%20about%20Tanvelo%20LLM%20Gateway."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
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
            Put every model behind one controlled endpoint in under five minutes.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="#quickstart"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-900 hover:bg-black text-white text-sm font-medium transition-all shadow-sm hover:shadow"
            >
              <span>Read the quickstart</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/overview"
              className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium border border-slate-200 transition-all"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Comprehensive Footer */}
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
                One controlled endpoint for OpenAI, Anthropic, and Google Gemini with deterministic routing, atomic rate limits, and real-time telemetry.
              </p>
              <div className="pt-1 text-[11px] font-mono text-slate-500">
                Built for mission-critical LLM infrastructure.
              </div>
            </div>

            {/* Col 2: Architecture & Product */}
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-slate-200 font-semibold mb-4">
                Platform
              </div>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><a href="#difference" className="hover:text-white transition">Architecture</a></li>
                <li><a href="#capabilities" className="hover:text-white transition">Capabilities</a></li>
                <li><a href="#quickstart" className="hover:text-white transition">Quickstart & SDK</a></li>
                <li><a href="#trust" className="hover:text-white transition">Security Controls</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
                <li><Link href="/docs" className="hover:text-white transition">Documentation</Link></li>
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
                <li>
                  <span className="block text-[11px] font-mono uppercase text-slate-500">WhatsApp</span>
                  <a
                    href="https://wa.me/919771370409"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition text-slate-200 font-mono text-xs flex items-center gap-1.5 mt-1"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+91 9771370409</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Socials & Legal */}
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-slate-200 font-semibold mb-4">
                Social & Community
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
