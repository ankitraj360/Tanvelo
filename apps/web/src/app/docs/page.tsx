'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  Terminal,
  Code2,
  Sparkles,
  Shield,
  Zap,
  BookOpen,
  Cpu,
  Coins,
  Gauge,
  Webhook,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Layers,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';

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

export default function DocsPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeQuickTab, setActiveQuickTab] = useState<'ts' | 'py' | 'curl'>('ts');

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tsQuickSnippet = `// npm install tanvelo
import { Tanvelo } from "tanvelo";

const tanvelo = new Tanvelo({
  apiKey: process.env.TANVELO_API_KEY, // 'tv_live_...'
});

async function main() {
  const response = await tanvelo.chat.completions.create({
    model: "claude-3-5-sonnet",
    fallbacks: ["gemini-1.5-pro", "deepseek-chat"],
    messages: [
      { role: "system", content: "You are a senior systems engineer." },
      { role: "user", content: "Explain deterministic circuit breakers." }
    ],
    temperature: 0.7,
  });

  console.log(response.choices[0].message.content);
  console.log("Fulfilled by:", response._tanvelo?.provider);
  console.log("Latency:", response._tanvelo?.latencyMs, "ms");
}

main();`;

  const pyQuickSnippet = `# pip install tanvelo
from tanvelo import Tanvelo

client = Tanvelo(api_key="tv_live_...")

response = client.chat.completions.create(
    model="claude-3-5-sonnet",
    fallbacks=["gemini-1.5-pro", "deepseek-chat"],
    messages=[
        {"role": "system", "content": "You are a senior systems engineer."},
        {"role": "user", "content": "Explain deterministic circuit breakers."}
    ]
)

print(response.content)
print("Fulfilled by:", response.headers.get("x-tanvelo-provider"))
print("Latency:", response.headers.get("x-tanvelo-latency-ms"), "ms")`;

  const curlQuickSnippet = `curl -X POST https://tanvelo-backend-zgyc.onrender.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer tv_live_..." \\
  -d '{
    "model": "claude-3-5-sonnet",
    "fallbacks": ["gemini-1.5-pro", "deepseek-chat"],
    "messages": [
      {"role": "user", "content": "Explain deterministic circuit breakers."}
    ],
    "temperature": 0.7
  }'`;

  const tsStreamingSnippet = `import { Tanvelo } from "tanvelo";

const tanvelo = new Tanvelo({ apiKey: process.env.TANVELO_API_KEY });

const stream = await tanvelo.chat.completions.create({
  model: "claude-3-5-sonnet",
  fallbacks: ["gemini-1.5-pro"],
  messages: [{ role: "user", content: "Stream a high-availability checklist." }],
  stream: true,
});

for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content || "";
  process.stdout.write(text);
}`;

  const pyStreamingSnippet = `from tanvelo import Tanvelo

client = Tanvelo()

stream = client.chat.completions.create(
    model="gemini-1.5-flash",
    fallbacks=["claude-3-haiku", "gpt-4o-mini"],
    messages=[{"role": "user", "content": "Stream a high-availability checklist."}],
    stream=True
)

for chunk in stream:
    print(chunk.delta, end="", flush=True)
print()`;

  const webhookVerifyTs = `import crypto from 'crypto';

// Verify Tanvelo webhook signatures: "t=TIMESTAMP,v1=SIGNATURE"
export function verifyTanveloWebhook(payloadRaw, signatureHeader, secret) {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => p.split('='))
  );

  const timestamp = parts.t;
  const signature = parts.v1;

  // Protect against replay attacks (5 minute threshold)
  if (Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)) > 300) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${payloadRaw}\`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`;

  const webhookVerifyPy = `import hmac
import hashlib
import time

def verify_tanvelo_webhook(payload_raw: bytes, signature_header: str, secret: str) -> bool:
    parts = dict(item.split("=") for item in signature_header.split(","))
    timestamp = parts.get("t")
    signature = parts.get("v1")

    if not timestamp or not signature:
        return False

    if abs(time.time() - int(timestamp)) > 300:
        return False

    signed_payload = f"{timestamp}.".encode("utf-8") + payload_raw
    expected = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()

    return hmac.compare_digest(signature, expected)`;

  const navSections = [
    { id: 'overview', title: '1. Architecture & Overview' },
    { id: 'quickstart', title: '2. 60-Second Quickstart' },
    { id: 'ts-sdk', title: '3. Official TypeScript SDK' },
    { id: 'py-sdk', title: '4. Official Python SDK' },
    { id: 'rest-api', title: '5. Direct REST API Reference' },
    { id: 'fallbacks', title: '6. Fallbacks & Circuit Breakers' },
    { id: 'rate-limits', title: '7. Rate Limits & Spend Caps' },
    { id: 'webhooks', title: '8. Webhook Signatures' },
    { id: 'errors', title: '9. Status Codes & Errors' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-sky-100 selection:text-sky-900">
      {/* Top Standalone Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <Link href="/" className="flex items-center gap-2 text-slate-900 font-semibold tracking-tight text-base">
              <Logo size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>v1.0.0 Production Gateway</span>
            </div>
            <Link
              href="/overview"
              className="inline-flex items-center justify-center h-8 px-3.5 text-xs font-medium bg-slate-900 hover:bg-black text-white rounded-lg transition shadow-xs"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Documentation Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header Hero Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cyan">Official Documentation</Badge>
            <Badge variant="outline">Production Reference v1.0.0</Badge>
            <span className="text-xs font-mono text-slate-400">Target Gateway: /v1/chat/completions</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Tanvelo LLM Gateway &amp; Official SDK Reference
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            Tanvelo is the unified LLM API gateway and control plane designed for mission-critical artificial intelligence applications. Use our official TypeScript and Python client SDKs to route across Anthropic Claude, Google Gemini, DeepSeek, Groq, Mistral, Ollama, and OpenAI with sub-180ms deterministic fallbacks, atomic rate limiting, and auditable telemetry.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-700">
              <span className="text-sky-600 font-semibold">TypeScript:</span>
              <code>npm i tanvelo</code>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-700">
              <span className="text-emerald-600 font-semibold">Python:</span>
              <code>pip install tanvelo</code>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-700">
              <span className="text-purple-600 font-semibold">Gateway:</span>
              <code>https://tanvelo-backend-zgyc.onrender.com/v1</code>
            </div>
          </div>
        </div>

        {/* 2-Column Docs Layout: Sidebar Navigation + Detailed Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sticky Table of Contents */}
          <aside className="lg:col-span-3 sticky top-20 hidden lg:block space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                Documentation Index
              </div>
              <nav className="space-y-1">
                {navSections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-2.5 py-1.5 rounded-md transition"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>

            <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl text-xs space-y-2">
              <div className="font-semibold text-sky-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Need API Keys?
              </div>
              <p className="text-sky-800 leading-relaxed text-[11px]">
                Create Bearer API keys directly in the Tanvelo Dashboard to start routing requests.
              </p>
              <Link
                href="/api-keys"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 underline"
              >
                Manage API Keys &rarr;
              </Link>
            </div>
          </aside>

          {/* Right Main Content Column */}
          <main className="lg:col-span-9 space-y-12">
            {/* 1. Architecture & Overview */}
            <section id="overview" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold font-mono">
                  01
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Architecture &amp; Gateway Overview</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tanvelo functions as a resilient, multi-cloud API gateway sitting between your AI applications and upstream model providers. By isolating client logic from specific provider endpoints, you eliminate vendor lock-in, prevent cascading outages from upstream rate-limits (HTTP 429), and enforce strict governance across your team.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-xs">Deterministic Failover</h3>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Upstream 429s and 5xx outages failover automatically to secondary models in under 180ms without dropping the client stream.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-xs">Distributed Token Buckets</h3>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Redis-backed atomic rate limiting enforces requests-per-minute (RPM) and tokens-per-minute (TPM) per API key.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-xs">Zero Body Retention</h3>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Prompts and model responses are streamed in-flight and never stored on disk. Only cryptographic telemetry is logged.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. 60-Second Quickstart */}
            <section id="quickstart" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold font-mono">
                  02
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">60-Second Quickstart</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect your providers in the Tanvelo Dashboard, generate an API key, and make your first completion with automatic multi-provider fallback.
              </p>

              {/* Code Snippet Box with Tabs */}
              <Card>
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 rounded-t-xl">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => setActiveQuickTab('ts')}
                      className={`px-3 py-1 rounded text-xs font-mono transition ${
                        activeQuickTab === 'ts'
                          ? 'bg-slate-800 text-white font-medium border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      TypeScript (tanvelo)
                    </button>
                    <button
                      onClick={() => setActiveQuickTab('py')}
                      className={`px-3 py-1 rounded text-xs font-mono transition ${
                        activeQuickTab === 'py'
                          ? 'bg-slate-800 text-white font-medium border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Python (tanvelo)
                    </button>
                    <button
                      onClick={() => setActiveQuickTab('curl')}
                      className={`px-3 py-1 rounded text-xs font-mono transition ${
                        activeQuickTab === 'curl'
                          ? 'bg-slate-800 text-white font-medium border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      cURL
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      copyCode(
                        activeQuickTab === 'ts'
                          ? tsQuickSnippet
                          : activeQuickTab === 'py'
                          ? pyQuickSnippet
                          : curlQuickSnippet,
                        'quick'
                      )
                    }
                    className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded hover:bg-slate-800 transition"
                  >
                    {copiedKey === 'quick' ? (
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

                <div className="bg-slate-950 p-4 sm:p-5 rounded-b-xl overflow-x-auto">
                  <pre className="font-mono text-xs sm:text-[13px] text-slate-200 leading-relaxed">
                    <code>
                      {activeQuickTab === 'ts'
                        ? tsQuickSnippet
                        : activeQuickTab === 'py'
                        ? pyQuickSnippet
                        : curlQuickSnippet}
                    </code>
                  </pre>
                </div>
              </Card>
            </section>

            {/* 3. Official TypeScript SDK */}
            <section id="ts-sdk" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold font-mono">
                  03
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Official TypeScript &amp; Node.js SDK</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The official TypeScript SDK is published as <code className="text-sky-700 font-mono bg-sky-50 px-1 py-0.5 rounded border border-sky-100">tanvelo</code> (also aliased as <code className="text-sky-700 font-mono bg-sky-50 px-1 py-0.5 rounded border border-sky-100">@tanvelo/sdk</code>). It has zero third-party runtime dependencies and provides complete typings for completions, streaming SSE, and gateway telemetry.
              </p>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-xs font-mono text-sky-600">Installation</CardTitle>
                      <CardDescription>Install from npm, pnpm, or yarn</CardDescription>
                    </div>
                    <button
                      onClick={() => copyCode('npm install tanvelo', 'install-ts')}
                      className="text-xs font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    >
                      {copiedKey === 'install-ts' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'install-ts' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-3 rounded-lg bg-slate-900 font-mono text-xs text-slate-100 overflow-x-auto">
                      npm install tanvelo
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-xs font-mono text-sky-600">Real-Time Streaming Example</CardTitle>
                      <CardDescription>Server-Sent Events (SSE) streaming with async iterable</CardDescription>
                    </div>
                    <button
                      onClick={() => copyCode(tsStreamingSnippet, 'stream-ts')}
                      className="text-xs font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    >
                      {copiedKey === 'stream-ts' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'stream-ts' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-lg bg-slate-900 font-mono text-xs text-slate-100 overflow-x-auto leading-relaxed">
                      {tsStreamingSnippet}
                    </pre>
                  </CardContent>
                </Card>

                {/* Configuration Table */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs overflow-x-auto">
                  <h4 className="font-semibold text-xs text-slate-900 mb-3 font-mono">TanveloClient Options</h4>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-mono">
                        <th className="pb-2">Property</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Default</th>
                        <th className="pb-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-2 font-mono text-sky-700">apiKey</td>
                        <td className="py-2 font-mono text-slate-500">string</td>
                        <td className="py-2 font-mono text-slate-400">process.env.TANVELO_API_KEY</td>
                        <td className="py-2">Your gateway Bearer API key (<code className="text-slate-800">tv_live_...</code>)</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-sky-700">baseUrl</td>
                        <td className="py-2 font-mono text-slate-500">string</td>
                        <td className="py-2 font-mono text-slate-400">https://tanvelo-backend-zgyc.onrender.com/v1</td>
                        <td className="py-2">Custom gateway proxy endpoint</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-sky-700">timeout</td>
                        <td className="py-2 font-mono text-slate-500">number</td>
                        <td className="py-2 font-mono text-slate-400">30000 (30s)</td>
                        <td className="py-2">Connection and response timeout in milliseconds</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-sky-700">maxRetries</td>
                        <td className="py-2 font-mono text-slate-500">number</td>
                        <td className="py-2 font-mono text-slate-400">2</td>
                        <td className="py-2">Automatic network retry attempts</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 4. Official Python SDK */}
            <section id="py-sdk" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold font-mono">
                  04
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Official Python SDK</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The Python client is published as <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">tanvelo</code> on PyPI. It requires zero third-party packages, utilizing Python&apos;s standard library to guarantee compatibility across microservices, AWS Lambda, Google Cloud Run, and Docker containers.
              </p>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-xs font-mono text-emerald-600">Installation</CardTitle>
                      <CardDescription>Install from PyPI</CardDescription>
                    </div>
                    <button
                      onClick={() => copyCode('pip install tanvelo', 'install-py')}
                      className="text-xs font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    >
                      {copiedKey === 'install-py' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'install-py' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-3 rounded-lg bg-slate-900 font-mono text-xs text-slate-100 overflow-x-auto">
                      pip install tanvelo
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-xs font-mono text-emerald-600">Python Streaming Example</CardTitle>
                      <CardDescription>Iterator-based streaming with immediate stdout flushing</CardDescription>
                    </div>
                    <button
                      onClick={() => copyCode(pyStreamingSnippet, 'stream-py')}
                      className="text-xs font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    >
                      {copiedKey === 'stream-py' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'stream-py' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-lg bg-slate-900 font-mono text-xs text-slate-100 overflow-x-auto leading-relaxed">
                      {pyStreamingSnippet}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* 5. Direct REST API Reference */}
            <section id="rest-api" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold font-mono">
                  05
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Direct HTTP / REST API Reference</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect from any programming language (Go, Rust, Ruby, Elixir, C#, PHP) by sending a standard HTTP POST request.
              </p>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan" className="font-mono">POST</Badge>
                    <span className="font-mono text-sm font-bold text-slate-900">/v1/chat/completions</span>
                  </div>
                  <CardDescription>Primary chat completions endpoint supporting standard JSON and SSE streaming</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Request Headers */}
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 mb-2 font-mono">Required Request Headers</h4>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 space-y-1">
                      <div><span className="text-slate-400">Content-Type:</span> application/json</div>
                      <div><span className="text-slate-400">Authorization:</span> Bearer tv_live_...</div>
                      <div><span className="text-slate-400">X-Tanvelo-Fallbacks:</span> claude-3-5-sonnet,gemini-1.5-pro <span className="text-slate-400">(optional)</span></div>
                    </div>
                  </div>

                  {/* Body Parameters Table */}
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 mb-2 font-mono">Request Body Parameters</h4>
                    <div className="border border-slate-200 rounded-lg overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                            <th className="p-3">Field</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Required</th>
                            <th className="p-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          <tr>
                            <td className="p-3 font-mono font-medium text-sky-700">model</td>
                            <td className="p-3 font-mono text-slate-500">string</td>
                            <td className="p-3 font-semibold text-rose-600">Yes</td>
                            <td className="p-3">Primary model identifier (e.g. <code className="text-slate-800">claude-3-5-sonnet</code>, <code className="text-slate-800">gemini-1.5-pro</code>, <code className="text-slate-800">deepseek-chat</code>)</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-medium text-sky-700">messages</td>
                            <td className="p-3 font-mono text-slate-500">array</td>
                            <td className="p-3 font-semibold text-rose-600">Yes</td>
                            <td className="p-3">Array of message objects: <code className="text-slate-800">{`[{ role: "user", content: "..." }]`}</code></td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-medium text-sky-700">fallbacks</td>
                            <td className="p-3 font-mono text-slate-500">string[]</td>
                            <td className="p-3 text-slate-400">No</td>
                            <td className="p-3">Ordered backup models to execute if primary fails with 429, timeout, or 5xx</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-medium text-sky-700">stream</td>
                            <td className="p-3 font-mono text-slate-500">boolean</td>
                            <td className="p-3 text-slate-400">No</td>
                            <td className="p-3">If <code className="text-slate-800">true</code>, returns Server-Sent Events (<code className="text-slate-800">text/event-stream</code>)</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-medium text-sky-700">temperature</td>
                            <td className="p-3 font-mono text-slate-500">number</td>
                            <td className="p-3 text-slate-400">No</td>
                            <td className="p-3">Sampling temperature between <code className="text-slate-800">0.0</code> and <code className="text-slate-800">2.0</code></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Telemetry Headers Emitted */}
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 mb-2 font-mono">Telemetry Headers Returned by Gateway</h4>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 space-y-1">
                      <div><span className="text-sky-600 font-semibold">X-Tanvelo-Request-Id:</span> req_c82fa0... <span className="text-slate-400">(Unique request tracking UUID)</span></div>
                      <div><span className="text-sky-600 font-semibold">X-Tanvelo-Provider:</span> anthropic <span className="text-slate-400">(Actual provider fulfilling response)</span></div>
                      <div><span className="text-sky-600 font-semibold">X-Tanvelo-Model:</span> claude-3-5-sonnet-20241022 <span className="text-slate-400">(Actual model used)</span></div>
                      <div><span className="text-sky-600 font-semibold">X-Tanvelo-Latency-Ms:</span> 142 <span className="text-slate-400">(Roundtrip latency)</span></div>
                      <div><span className="text-sky-600 font-semibold">X-Tanvelo-Cost-Usd:</span> 0.000350 <span className="text-slate-400">(Calculated cost)</span></div>
                      <div><span className="text-sky-600 font-semibold">X-RateLimit-Limit:</span> 60 <span className="text-slate-400">(Max requests allowed per window)</span></div>
                      <div><span className="text-sky-600 font-semibold">X-RateLimit-Remaining:</span> 59 <span className="text-slate-400">(Remaining quota)</span></div>
                      <div><span className="text-sky-600 font-semibold">X-RateLimit-Reset:</span> 45 <span className="text-slate-400">(Seconds until reset)</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 6. Fallbacks & Circuit Breakers */}
            <section id="fallbacks" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold font-mono">
                  06
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Deterministic Fallbacks &amp; Circuit Breakers</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When upstream LLM providers return rate limit rejections (HTTP 429), gateway timeouts (504), or internal service errors (500/502/503), Tanvelo does not fail your client request. Instead, it seamlessly triggers your secondary model choices in under 180ms without interrupting active streaming connections.
              </p>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="text-sky-400 font-semibold">Fallback Resolution Order:</div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-slate-300">
                  <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">1. Primary: gpt-4o</span>
                  <span className="text-rose-400">&rarr; 429 RateLimit (Fail) &rarr;</span>
                  <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">2. Fallback: claude-3-5-sonnet</span>
                  <span className="text-emerald-400">&rarr; 200 OK (Success in 142ms)</span>
                </div>
              </div>
            </section>

            {/* 7. Rate Limits & Spend Caps */}
            <section id="rate-limits" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold font-mono">
                  07
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Distributed Rate Limits &amp; Spend Caps</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tanvelo protects infrastructure with atomic Redis-backed token-bucket algorithms and project monthly budget safeguards.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5 font-mono">
                    <Gauge className="w-4 h-4 text-sky-600" /> Token-Bucket Quotas
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Set limits for RPM (Requests Per Minute), TPM (Tokens Per Minute), RPH, or RPD. When limits are exceeded, requests return standard <code className="text-slate-800 font-mono">429</code> with a <code className="text-slate-800 font-mono">Retry-After</code> header.
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5 font-mono">
                    <Coins className="w-4 h-4 text-emerald-600" /> Hard Spend Caps
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Prevent runaway autonomous agent loops from running up huge bills. Hard budget cutoffs immediately reject requests once monthly spend caps are hit, while warning webhooks fire at 80% utilization.
                  </p>
                </div>
              </div>
            </section>

            {/* 8. Webhook Signatures */}
            <section id="webhooks" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold font-mono">
                  08
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Webhook Signature Verification (HMAC-SHA256)</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tanvelo delivers webhooks with a cryptographically verifiable <code className="text-amber-800 font-mono bg-amber-50 px-1 py-0.5 rounded border border-amber-200">Tanvelo-Signature</code> header in the format <code className="text-slate-800 font-mono">t=TIMESTAMP,v1=SIGNATURE</code>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-mono text-amber-600">TypeScript / Node.js Verification</CardTitle>
                    <button
                      onClick={() => copyCode(webhookVerifyTs, 'wh-ts')}
                      className="text-xs font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    >
                      {copiedKey === 'wh-ts' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'wh-ts' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-3 rounded-lg bg-slate-900 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed">
                      {webhookVerifyTs}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-mono text-amber-600">Python Verification</CardTitle>
                    <button
                      onClick={() => copyCode(webhookVerifyPy, 'wh-py')}
                      className="text-xs font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    >
                      {copiedKey === 'wh-py' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'wh-py' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-3 rounded-lg bg-slate-900 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed">
                      {webhookVerifyPy}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* 9. Status Codes & Errors */}
            <section id="errors" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold font-mono">
                  09
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">HTTP Status Codes &amp; Error Payloads</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                All error payloads follow a unified JSON specification: <code className="text-slate-800 font-mono">{`{ "error": { "message": "...", "type": "...", "code": "..." } }`}</code>
              </p>

              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                      <th className="p-3">Status Code</th>
                      <th className="p-3">Error Type</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="p-3 font-mono font-semibold text-rose-600">400 Bad Request</td>
                      <td className="p-3 font-mono text-slate-600">invalid_request_error</td>
                      <td className="p-3">Missing required fields (<code className="text-slate-800">model</code>, <code className="text-slate-800">messages</code>) or malformed JSON payload</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold text-rose-600">401 Unauthorized</td>
                      <td className="p-3 font-mono text-slate-600">authentication_error</td>
                      <td className="p-3">Missing or invalid Tanvelo API key (must begin with <code className="text-slate-800">tv_live_</code>)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold text-amber-600">429 Too Many Requests</td>
                      <td className="p-3 font-mono text-slate-600">rate_limit_exceeded</td>
                      <td className="p-3">Rate limit quota exceeded or hard monthly spending budget reached</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold text-rose-600">502 Bad Gateway</td>
                      <td className="p-3 font-mono text-slate-600">upstream_provider_error</td>
                      <td className="p-3">Primary provider and all configured fallbacks failed or timed out</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold text-rose-600">503 Service Unavailable</td>
                      <td className="p-3 font-mono text-slate-600">provider_unavailable</td>
                      <td className="p-3">No upstream provider credentials configured in dashboard for requested model</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Standalone Footer Matching Terms & Privacy */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-12 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-slate-400">|</span>
            <span>&copy; 2026 Tanvelo. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="mailto:tanvelo@zohomail.in"
              className="text-slate-600 hover:text-slate-900 font-mono transition"
            >
              tanvelo@zohomail.in
            </a>
            <a
              href="https://x.com/tanvelo_in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-mono transition"
            >
              <XSocialIcon className="w-3.5 h-3.5" />
              <span>@tanvelo_in</span>
            </a>
            <a
              href="https://instagram.com/tanvelo_in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-700 hover:text-pink-600 font-mono transition"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>@tanvelo_in</span>
            </a>
            <Link href="/privacy" className="hover:text-slate-900 transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 transition">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
