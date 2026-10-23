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
  ShieldCheck,
  EyeOff,
  Database,
  Server,
  Layers,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  CreditCard,
  Cpu,
  Globe,
  Boxes,
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
  'OpenAI',
  'Anthropic Claude',
  'Google Gemini',
  'DeepSeek',
  'Cerebras (1,800+ tok/s)',
  'Groq (LPU)',
  'Together AI',
  'Fireworks AI',
  'xAI Grok',
  'Mistral AI',
  'AWS Bedrock',
  'Azure OpenAI',
  'Alibaba Qwen',
  'vLLM / On-Prem',
  'Ollama / Local',
  'Moonshot AI (Kimi)',
  'OpenRouter',
  'SambaNova',
  'Perplexity',
  'Any Custom OpenAI API',
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

// Unified routing across 147+ providers with sub-180ms failover
const stream = await tanvelo.chat.completions.create({
  model: "provider/your-model-name",
  fallbacks: ["fallback-provider/your-fallback-model-name"],
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

# Automated sub-180ms failover across 147+ providers
stream = client.chat.completions.create(
    model="provider/your-model-name",
    fallbacks=["fallback-provider/your-fallback-model-name"],
    messages=[{"role": "user", "content": "Ship to production with zero downtime."}],
    stream=True,
)

for chunk in stream:
    print(chunk.delta, end="", flush=True)`,
    curl: `curl -X POST https://tanvelo-backend-zgyc.onrender.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $TANVELO_API_KEY" \\
  -d '{
    "model": "provider/your-model-name",
    "fallbacks": ["fallback-provider/your-fallback-model-name"],
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
      q: 'How many AI providers and models can I use with Tanvelo?',
      a: 'Tanvelo supports 147+ AI providers out of the box — spanning frontier clouds (OpenAI, Anthropic Claude, Google Gemini, xAI), wafer-scale fast silicon (Cerebras, Groq, Together AI, Fireworks), enterprise clouds (Azure OpenAI, AWS Bedrock), regional Asian labs (Alibaba Qwen/DashScope, Moonshot Kimi, Zhipu GLM, 01.AI), and self-hosted runners (vLLM, Ollama, LM Studio). Additionally, you can connect ANY custom OpenAI-compatible endpoint with your own base URL and authentication headers.',
    },
    {
      q: 'Does Tanvelo save my users\' questions or AI answers?',
      a: 'No. Unlike traditional gateways like Portkey and Helicone which log and store prompt bodies and AI completions in their cloud databases by default, Tanvelo strictly enforces Zero Payload Retention by default (LOG_PAYLOADS=false). All token streams pass through transient RAM via Server-Sent Events (SSE) and are immediately discarded. Only operational telemetry (token counts, latency, status code, exact cost) is recorded.',
    },
    {
      q: 'How does the sub-180ms fallback circuit breaker work?',
      a: 'When an upstream provider returns a 429 rate limit or 5xx outage, Tanvelo immediately re-routes the in-flight request to secondary fallback models without terminating the client connection or dropping active SSE chunks.',
    },
    {
      q: 'How does Tanvelo compare to Portkey, Helicone, and OpenRouter?',
      a: 'Portkey and Helicone log and retain full request/response bodies by default, posing data compliance hurdles for healthcare, fintech, and legal apps. OpenRouter marks up token prices with a 5.5%–8% deposit fee. Tanvelo offers Zero Retention by default, true Bring-Your-Own-Key (BYOK) with AES-256-GCM encryption, and flat request-based pricing with zero markup on your LLM tokens.',
    },
    {
      q: 'Can I enforce rate limits and hard spend caps?',
      a: 'Yes. Tanvelo provides atomic Redis token-bucket rate limiting (RPM/TPM) and project-level monthly budget ceilings that cut off requests before runaway agent loops accumulate unexpected costs.',
    },
    {
      q: 'What is the Tanvelo Official SDK?',
      a: 'The official Tanvelo SDK (tanvelo on npm and PyPI) is a lightweight, zero-dependency client with native multi-provider fallbacks, Server-Sent Events (SSE) streaming, and real-time latency and cost telemetry.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* Premium Minimal Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-slate-900 font-semibold tracking-tight text-base group">
            <img src="/assets/logo.svg" alt="Tanvelo" className="w-5 h-5 transition-transform group-hover:scale-105" />
            <span>tanvelo</span>
          </Link>

          {/* Cleaned Navigation Bar */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600">
            <a href="#providers" className="hover:text-slate-900 transition-colors font-medium">147+ Providers</a>
            <a href="#architecture" className="hover:text-slate-900 transition-colors">Architecture</a>
            <a href="#capabilities" className="hover:text-slate-900 transition-colors">Capabilities</a>
            <a href="#zero-retention" className="hover:text-sky-600 transition-colors flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Zero Retention</span>
            </a>
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
              <a href="#providers" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-900">
                147+ AI Providers &amp; Any API
              </a>
              <a href="#architecture" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
                Architecture
              </a>
              <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
                Capabilities
              </a>
              <a href="#zero-retention" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-700 font-medium">
                Zero Retention &amp; Privacy
              </a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
                Contact
              </a>
              <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sky-600 font-semibold hover:bg-sky-50">
                Documentation &amp; SDK &rarr;
              </Link>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">Privacy Policy</Link>
              <span>·</span>
              <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">Terms of Service</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-100 overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono mb-6 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Zero-Payload Retention • 147+ AI Providers &amp; Any API</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.035em] text-slate-900 leading-[1.08] mb-5">
              Every model.<br />
              Zero prompt retention.<br />
              Zero downtime.
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-7 max-w-lg mx-auto lg:mx-0">
              The high-availability LLM API gateway that protects your data. Unified routing across 147+ AI providers — OpenAI, Anthropic Claude, Google Gemini, Cerebras, Groq, Together AI, DeepSeek, xAI, and custom private endpoints — with sub-180ms failover, atomic spend controls, and zero storage of prompts or AI responses.
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
              <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Zero Retention by Default</span>
              <span>·</span>
              <span className="text-sky-700 font-medium bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">147+ AI Providers</span>
              <span>·</span>
              <span>Sub-180ms Failover</span>
              <span>·</span>
              <span>Native SSE</span>
              <span>·</span>
              <span>BYOK Encrypted</span>
            </div>
          </div>

          {/* 3D Visual */}
          <div className="relative w-full h-[320px] sm:h-[400px] md:h-[460px] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50/50 border border-slate-100 shadow-2xs">
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
            147+ Supported Models
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

      {/* Key Stats Strip */}
      <section className="py-10 border-b border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">0 Bytes</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Prompt &amp; Completion Storage</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 tracking-tight">&lt; 180ms</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Automated Failover Latency</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">147+ Providers</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Unified Gateway &amp; Custom Endpoints</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">100% BYOK</div>
              <div className="text-xs text-slate-500 font-medium mt-1">AES-256-GCM Encrypted Keys</div>
            </div>
          </div>
        </div>
      </section>

      {/* ZERO RETENTION & PRIVACY ADVANTAGE SPOTLIGHT (THE BIG DIFFERENTIATOR) */}
      <section id="zero-retention" className="py-20 md:py-24 border-b border-slate-100 bg-gradient-to-b from-white via-slate-50/60 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-medium mb-3">
              <EyeOff className="w-3.5 h-3.5" />
              <span>THE PRIVACY ADVANTAGE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-slate-900 mb-3">
              Zero Payload Retention by Default.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Unlike traditional gateways that save and store your users&apos; prompts and generated answers in their cloud database, Tanvelo processes every inference stream strictly in transient RAM.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* The Competitor Model */}
            <div className="p-7 sm:p-8 rounded-2xl border border-rose-200 bg-white/90 shadow-2xs space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-rose-50 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-rose-600 tracking-wider flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  TRADITIONAL GATEWAYS (PORTKEY / HELICONE)
                </span>
                <span className="text-[10px] font-mono uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-semibold">
                  Logs Payloads
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Most AI gateways are built as observability collectors: every prompt message, system instruction, and model response is written to third-party databases by default.
              </p>

              <div className="space-y-3.5 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">Saves Questions &amp; Answers:</strong> End-user confidential prompts and generated outputs are persisted in third-party logs.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">Compliance &amp; Legal Exposure:</strong> Creates immediate regulatory complications for HIPAA, GDPR, SOC 2, and confidential client NDAs.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">Forced Opt-Out Workarounds:</strong> Developers are forced to configure custom bypass headers or pay steep enterprise premiums to omit payload storage.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 text-[11px] text-rose-700 font-mono">
                ⚠ Risk: Prompts and AI answers stored on third-party cloud disk
              </div>
            </div>

            {/* The Tanvelo Model */}
            <div className="p-7 sm:p-8 rounded-2xl border-2 border-emerald-500 bg-white shadow-xs space-y-6 relative overflow-hidden ring-4 ring-emerald-50">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-700 tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  TANVELO UNIVERSAL GATEWAY
                </span>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                  Zero Retention
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Tanvelo is architected from the kernel level with strict Zero Body Retention (<code className="font-mono text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">LOG_PAYLOADS=false</code>). Your users&apos; prompts and model outputs never touch our disk.
              </p>

              <div className="space-y-3.5 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">In-Flight Transient Streaming:</strong> Token chunks are piped directly through memory via Server-Sent Events (SSE) and immediately discarded.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">Enterprise Privacy Safe:</strong> Safe for healthcare, fintech, legal tech, and private B2B applications where prompt leakage is unacceptable.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900">Telemetry-Only Ledger:</strong> Only mathematical token usage, latency (ms), HTTP status codes, and exact dollar costs are audited.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-800 font-mono flex items-center justify-between">
                <span>✓ 0% prompt body retention • AES-256-GCM encrypted BYOK</span>
                <Link href="/privacy" className="underline hover:text-emerald-900 font-semibold">Privacy Spec &rarr;</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 147+ AI PROVIDERS & UNIVERSAL INGRESS */}
      <section id="providers" className="py-20 md:py-24 border-b border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-mono font-medium mb-3">
              <Boxes className="w-3.5 h-3.5" />
              <span>UNIVERSAL LLM FEDERATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-slate-900 mb-3">
              147+ AI Providers &amp; Any Custom API
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Connect to any frontier model, ultra-fast silicon accelerator, regional lab, or private on-prem cluster with zero code changes. Like LiteLLM, Tanvelo standardizes routing across all providers with universal prefix syntax.
            </p>
          </div>

          {/* 6 Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {/* 1. Fast Silicon */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                  Up to 2,000 tok/s
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Ultra-Fast &amp; Wafer Silicon</h3>
                <p className="text-xs text-slate-500 mt-0.5">Sub-second reasoning and token generation</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cerebras, Groq (LPUs), SambaNova, Together AI, Fireworks AI, DeepInfra, Lepton AI, Novita.
              </p>
              <div className="font-mono text-[11px] text-slate-500 bg-white border border-slate-200 rounded-md p-1.5">
                model: &quot;cerebras/your-model-name&quot;
              </div>
            </div>

            {/* 2. Frontier Cloud */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded">
                  Frontier SOTA
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Frontier Reasoning Labs</h3>
                <p className="text-xs text-slate-500 mt-0.5">Top-tier intelligence and multimodal models</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                OpenAI, Anthropic Claude, Google Gemini, xAI Grok, Mistral Large, Cohere.
              </p>
              <div className="font-mono text-[11px] text-slate-500 bg-white border border-slate-200 rounded-md p-1.5">
                model: &quot;anthropic/your-model-name&quot;
              </div>
            </div>

            {/* 3. Enterprise Cloud */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  Enterprise SLA
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Hyperscale Enterprise Cloud</h3>
                <p className="text-xs text-slate-500 mt-0.5">Compliant managed deployments</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Azure OpenAI, AWS Bedrock Proxy, Cloudflare Workers AI, Perplexity, Voyage AI, Databricks.
              </p>
              <div className="font-mono text-[11px] text-slate-500 bg-white border border-slate-200 rounded-md p-1.5">
                model: &quot;azure/your-model-name&quot;
              </div>
            </div>

            {/* 4. Regional & Asian Labs */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
                  Global Reach
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Regional &amp; Asian Frontier Labs</h3>
                <p className="text-xs text-slate-500 mt-0.5">World-class open-weights and multilingual AI</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                DeepSeek, Alibaba Qwen (DashScope), Moonshot Kimi, Zhipu GLM, 01.AI (Yi), Upstage Solar.
              </p>
              <div className="font-mono text-[11px] text-slate-500 bg-white border border-slate-200 rounded-md p-1.5">
                model: &quot;deepseek/your-model-name&quot;
              </div>
            </div>

            {/* 5. Self-Hosted & Local */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Server className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                  Air-Gapped &amp; Local
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Self-Hosted &amp; Local Inference</h3>
                <p className="text-xs text-slate-500 mt-0.5">Zero cloud egress costs &amp; internal hosting</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                vLLM, Ollama, LM Studio, Text Generation Inference (TGI), LocalAI, llama.cpp, Aphrodite.
              </p>
              <div className="font-mono text-[11px] text-slate-500 bg-white border border-slate-200 rounded-md p-1.5">
                model: &quot;vllm/your-model-name&quot;
              </div>
            </div>

            {/* 6. Any Custom API */}
            <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950 text-white shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center border border-sky-800">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-sky-400 bg-sky-900/60 px-2 py-0.5 rounded border border-sky-700/50">
                  Universal BYOK
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Universal &quot;Any API&quot; Ingress</h3>
                <p className="text-xs text-slate-400 mt-0.5">Connect ANY OpenAI-compatible endpoint</p>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Private corporate clusters, custom fine-tuned weights, or internal gateways. Supports Bearer, Azure api-key, custom headers, or unauthenticated runners.
              </p>
              <div className="font-mono text-[11px] text-sky-300 bg-slate-900 border border-slate-800 rounded-md p-1.5">
                model: &quot;custom-provider/your-model-name&quot;
              </div>
            </div>
          </div>

          {/* Bottom Banner with Prefix Routing & Links */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="text-xs font-mono uppercase text-sky-600 font-bold tracking-wider">
                Universal Prefix Syntax
              </div>
              <div className="text-sm font-semibold text-slate-900">
                Call any model using <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">model=&quot;provider/your-model-name&quot;</code> notation
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                Automatic key injection, URL resolution, and sub-180ms failover across providers without modifying your application client.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/docs#providers-catalog"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs"
              >
                Docs &amp; Prefix Syntax
              </Link>
              <Link
                href="/overview"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-slate-900 hover:bg-black text-xs font-medium text-white transition shadow-xs"
              >
                <span>Connect Providers in Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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

      {/* Interactive Circuit Breaker Visualizer (Failover Proof) */}
      <section className="py-20 md:py-24 border-b border-slate-100 bg-slate-50/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-600 font-semibold block mb-2">
                Real-Time Reliability Engine
              </span>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 mb-2">
                Sub-180ms automated failover in action.
              </h2>
              <p className="text-slate-600 text-sm max-w-xl">
                When upstream providers return rate limits (429) or outages (5xx), Tanvelo executes deterministic fallback chains to sustain production uptime.
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
                model: &quot;provider/your-model-name&quot;, fallbacks: [&quot;fallback-provider/your-fallback-model-name&quot;]
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
              <h3 className="font-semibold text-slate-900 text-xs">Fulfilled by Fallback Model</h3>
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
              Three architectural pillars designed for engineering teams shipping mission-critical LLM workflows.
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

      {/* Code Quickstart Showcase */}
      <section className="py-20 md:py-24 border-b border-slate-100 bg-slate-50/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-600 font-semibold block mb-2">
              Implementation
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 mb-3">
              One typed client for every model.
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
              Security &amp; Compliance
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 mb-3">
              Verifiable architectural guardrails.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Engineered with zero payload retention, cryptographic hashing, and hardened network isolation.
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
              <ShieldCheck className="w-4 h-4 text-emerald-600 mb-2" />
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
                <div className="text-xs font-semibold text-slate-900 font-mono mt-0.5">@tanvelo_xyz</div>
              </div>
              <a
                href="https://instagram.com/tanvelo_xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-1.5 px-3 rounded-lg border border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 text-slate-800 text-xs font-medium transition"
              >
                Follow @tanvelo_xyz
              </a>
            </div>

            {/* X */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <XSocialIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400">X (Twitter)</div>
                <div className="text-xs font-semibold text-slate-900 font-mono mt-0.5">@tanvelo_xyz</div>
              </div>
              <a
                href="https://x.com/tanvelo_xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-1.5 px-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-100 text-slate-800 text-xs font-medium transition"
              >
                Follow @tanvelo_xyz
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final Action CTA */}
      <section className="py-20 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-slate-900 mb-3">
            Build on resilient, private AI infrastructure.
          </h2>
          <p className="text-slate-600 text-sm mb-7">
            Deploy every model behind one controlled endpoint in under five minutes with Zero Payload Retention.
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
                The high-availability LLM API gateway with Zero Payload Retention, automated failovers, and atomic cost controls.
              </p>
            </div>

            {/* Col 2: Platform */}
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-slate-200 font-semibold mb-3">
                Platform
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#providers" className="hover:text-white transition font-medium text-slate-300">147+ AI Providers</a></li>
                <li><a href="#architecture" className="hover:text-white transition">Architecture</a></li>
                <li><a href="#capabilities" className="hover:text-white transition">Capabilities</a></li>
                <li><a href="#zero-retention" className="hover:text-white transition">Zero Retention</a></li>
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
                  <a href="https://x.com/tanvelo_xyz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition text-slate-300">
                    <XSocialIcon className="w-3.5 h-3.5" />
                    <span>X: @tanvelo_xyz</span>
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/tanvelo_xyz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition text-slate-300">
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>Instagram: @tanvelo_xyz</span>
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
              <span>Gateway Engine Operational • Zero Retention Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
