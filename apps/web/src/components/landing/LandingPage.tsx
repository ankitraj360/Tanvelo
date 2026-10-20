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
} from 'lucide-react';
import { LandingThreeGate } from './LandingThreeGate';

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<'python' | 'typescript' | 'curl'>('python');
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const codeSnippets = {
    python: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.tanvelo.com/v1",
    api_key="tv_live_948f2b...",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Ship to production."}],
    stream=True,
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")`,
    typescript: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.tanvelo.com/v1",
  apiKey: process.env.TANVELO_API_KEY,
});

const stream = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Ship to production." }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`,
    curl: `curl https://api.tanvelo.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $TANVELO_API_KEY" \\
  -d '{
    "model": "gpt-4o",
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
      a: 'No. Keep your existing OpenAI client. Set base_url="https://api.tanvelo.com/v1" and provide your Tanvelo key.',
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
            <Link href="/docs" className="hover:text-slate-900 transition-colors">Docs</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/overview"
              className="inline-flex items-center justify-center h-9 px-3.5 sm:px-4 text-xs font-medium bg-slate-900 hover:bg-black text-white rounded-full transition-all shadow-sm hover:shadow"
            >
              Dashboard
            </Link>

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
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
              >
                API Documentation & SDK
              </Link>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] tracking-wider uppercase mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              <span>Unified LLM Gateway v1.0</span>
            </div>

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
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="text-[10px] text-slate-400 tracking-wider">DETERMINISTIC ROUTE</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active 60fps
                </span>
              </div>
              <div className="text-slate-800 flex items-center gap-1 sm:gap-1.5 font-medium flex-wrap">
                <span>gpt-4o</span>
                <span className="text-sky-500">→</span>
                <span>claude-3-5</span>
                <span className="text-sky-500">→</span>
                <span>deepseek-v3</span>
                <span className="text-sky-500">→</span>
                <span>gemini-2</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provider Ecosystem Strip */}
      <section className="py-5 bg-slate-50/80 border-b border-slate-100 overflow-x-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-medium">
            ONE API · 10+ PROVIDERS & LOCAL MODELS
          </span>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto py-1">
            <span className="hover:text-slate-900 transition-colors whitespace-nowrap">OpenAI</span>
            <span className="hover:text-slate-900 transition-colors whitespace-nowrap">Anthropic Claude</span>
            <span className="hover:text-slate-900 transition-colors whitespace-nowrap">Google Gemini</span>
            <span className="hover:text-slate-900 transition-colors whitespace-nowrap">DeepSeek</span>
            <span className="hover:text-slate-900 transition-colors whitespace-nowrap">Groq</span>
            <span className="hover:text-slate-900 transition-colors whitespace-nowrap">Mistral AI</span>
            <span className="hover:text-slate-900 transition-colors whitespace-nowrap">Ollama / Local</span>
            <span className="hover:text-slate-900 transition-colors whitespace-nowrap">OpenRouter</span>
            <span className="hover:text-slate-900 transition-colors whitespace-nowrap">Cohere</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full font-mono text-xs text-slate-600 shrink-0">
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
            Keep your existing OpenAI SDK. Point the base URL at Tanvelo.
          </p>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-xl max-w-3xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {(['python', 'typescript', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveTab(lang)}
                    className={`px-3 py-1 rounded text-xs font-mono capitalize transition-colors ${
                      activeTab === lang
                        ? 'bg-slate-800 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors px-2 py-1"
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

      {/* Minimal Footer */}
      <footer className="py-8 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <img src="/assets/logo.svg" alt="Tanvelo Logo" className="w-4 h-4" />
            <span className="font-semibold text-slate-900">tanvelo</span>
            <span>© 2026. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a href="#difference" className="hover:text-slate-900 transition">Architecture</a>
            <a href="#capabilities" className="hover:text-slate-900 transition">Capabilities</a>
            <Link href="/docs" className="hover:text-slate-900 transition">Docs & SDK</Link>
            <Link href="/overview" className="hover:text-slate-900 transition">Dashboard</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition font-medium">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition font-medium">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
