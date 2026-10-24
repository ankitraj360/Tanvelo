'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  Shield,
  Zap,
  Gauge,
  Coins,
  Sparkles,
  GitFork,
  ExternalLink,
} from 'lucide-react';
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

  const tsQuickSnippet = `import { Tanvelo } from "tanvelo";

const tanvelo = new Tanvelo({
  apiKey: process.env.TANVELO_API_KEY, // "tv_live_..."
});

async function main() {
  const response = await tanvelo.chat.completions.create({
    model: "provider/your-model-name",
    fallbacks: ["fallback-provider/your-fallback-model-name"],
    messages: [
      { role: "system", content: "You are a concise production AI engineer." },
      { role: "user", content: "Explain deterministic circuit breakers." }
    ],
    temperature: 0.7,
  });

  console.log(response.choices[0].message.content);
  console.log("Provider:", response._tanvelo?.provider);
  console.log("Latency:", response._tanvelo?.latencyMs, "ms");
}

main();`;

  const pyQuickSnippet = `from tanvelo import Tanvelo

client = Tanvelo(api_key="tv_live_...")

response = client.chat.completions.create(
    model="provider/your-model-name",
    fallbacks=["fallback-provider/your-fallback-model-name"],
    messages=[
        {"role": "system", "content": "You are a concise production AI engineer."},
        {"role": "user", "content": "Explain deterministic circuit breakers."}
    ]
)

print(response.content)
print("Provider:", response.headers.get("x-tanvelo-provider"))
print("Latency:", response.headers.get("x-tanvelo-latency-ms"), "ms")`;

  const curlQuickSnippet = `curl -X POST https://tanvelo-backend-zgyc.onrender.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer tv_live_..." \\
  -d '{
    "model": "provider/your-model-name",
    "fallbacks": ["fallback-provider/your-fallback-model-name"],
    "messages": [
      {"role": "user", "content": "Explain deterministic circuit breakers."}
    ],
    "temperature": 0.7
  }'`;

  const tsStreamingSnippet = `import { Tanvelo } from "tanvelo";

const tanvelo = new Tanvelo({ apiKey: process.env.TANVELO_API_KEY });

const stream = await tanvelo.chat.completions.create({
  model: "provider/your-model-name",
  fallbacks: ["fallback-provider/your-fallback-model-name"],
  messages: [{ role: "user", content: "Stream a high-availability checklist." }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`;

  const pyStreamingSnippet = `from tanvelo import Tanvelo

client = Tanvelo()

stream = client.chat.completions.create(
    model="provider/your-model-name",
    fallbacks=["fallback-provider/your-fallback-model-name"],
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
    { id: 'quickstart', title: '2. Quickstart' },
    { id: 'ts-sdk', title: '3. TypeScript SDK' },
    { id: 'py-sdk', title: '4. Python SDK' },
    { id: 'rest-api', title: '5. Direct REST API' },
    { id: 'providers-catalog', title: '6. 140+ Providers & Custom APIs' },
    { id: 'fallbacks', title: '7. Fallbacks & Circuit Breakers' },
    { id: 'rate-limits', title: '8. Rate Limits & Spend Caps' },
    { id: 'webhooks', title: '9. Webhook Signatures' },
    { id: 'errors', title: '10. Status Codes & Errors' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <div className="h-3.5 w-px bg-slate-200" />
            <Link href="/" className="flex items-center gap-2 text-slate-900 font-semibold tracking-tight text-sm">
              <Logo size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              v1.0.0 Production
            </span>
            <Link
              href="/overview"
              className="inline-flex items-center justify-center h-7 px-3 text-xs font-medium bg-slate-900 hover:bg-black text-white rounded-lg transition shadow-xs"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Documentation Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header Hero Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs mb-8 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Official Documentation</Badge>
            <span className="text-xs font-mono text-slate-400">Endpoint: /v1/chat/completions</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-slate-900">
            Tanvelo Gateway &amp; Official SDK Reference
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            Complete technical guide for integrating Tanvelo&apos;s unified LLM gateway and official TypeScript and Python client SDKs into production AI applications.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
            <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-slate-700">
              <span className="text-sky-600 font-semibold">TS:</span> npm install tanvelo
            </div>
            <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-slate-700">
              <span className="text-emerald-600 font-semibold">Python:</span> pip install tanvelo
            </div>
            <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-slate-700">
              <span className="text-purple-600 font-semibold">URL:</span> https://tanvelo-backend-zgyc.onrender.com/v1
            </div>
          </div>
        </div>

        {/* 2-Column Docs Layout: Sticky Index + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Table of Contents */}
          <aside className="lg:col-span-3 sticky top-20 hidden lg:block space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2.5 px-2">
                Table of Contents
              </div>
              <nav className="space-y-0.5">
                {navSections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-2 py-1.5 rounded-md transition"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right Main Content */}
          <main className="lg:col-span-9 space-y-10">
            {/* 1. Architecture */}
            <section id="overview" className="scroll-mt-20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-sky-600">01</span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Architecture &amp; Gateway Overview
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tanvelo sits between your application and upstream LLM providers, providing unified routing, automated failovers, distributed token-bucket rate limits, and an auditable request ledger with zero prompt retention.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
                  <Zap className="w-4 h-4 text-sky-600 mb-1" />
                  <h3 className="font-semibold text-slate-900 text-xs">Deterministic Failover</h3>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Upstream 429s and 5xx outages failover to secondary models in under 180ms without dropping the active stream.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
                  <Gauge className="w-4 h-4 text-emerald-600 mb-1" />
                  <h3 className="font-semibold text-slate-900 text-xs">Distributed Limits</h3>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Redis-backed atomic token buckets enforce requests-per-minute (RPM) and tokens-per-minute (TPM) per API key.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
                  <Shield className="w-4 h-4 text-purple-600 mb-1" />
                  <h3 className="font-semibold text-slate-900 text-xs">Zero Retention</h3>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Prompts and provider outputs stream in-flight and are never stored on disk. Only cryptographic telemetry is logged.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Quickstart */}
            <section id="quickstart" className="scroll-mt-20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-sky-600">02</span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Quickstart
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect your upstream providers in the Tanvelo Dashboard, generate an API key, and make your first completion with automatic failover.
              </p>

              <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    {(['ts', 'py', 'curl'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveQuickTab(tab)}
                        className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                          activeQuickTab === tab
                            ? 'bg-slate-800 text-white font-medium border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab === 'ts' ? 'TypeScript' : tab === 'py' ? 'Python' : 'cURL'}
                      </button>
                    ))}
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
                    className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition"
                  >
                    {copiedKey === 'quick' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'quick' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                  <code>
                    {activeQuickTab === 'ts'
                      ? tsQuickSnippet
                      : activeQuickTab === 'py'
                      ? pyQuickSnippet
                      : curlQuickSnippet}
                  </code>
                </pre>
              </div>
            </section>

            {/* 3. Official TypeScript SDK */}
            <section id="ts-sdk" className="scroll-mt-20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-sky-600">03</span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Official TypeScript &amp; Node.js SDK
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Published as <code className="text-sky-700 font-mono bg-sky-50 px-1 py-0.5 rounded border border-sky-100">tanvelo</code>. Zero third-party runtime dependencies with complete typings for completions, SSE streaming, and telemetry.
              </p>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-medium text-slate-700">Streaming Example</span>
                  <button
                    onClick={() => copyCode(tsStreamingSnippet, 'stream-ts')}
                    className="text-xs font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1"
                  >
                    {copiedKey === 'stream-ts' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'stream-ts' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                  {tsStreamingSnippet}
                </pre>
              </div>
            </section>

            {/* 4. Official Python SDK */}
            <section id="py-sdk" className="scroll-mt-20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-sky-600">04</span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Official Python SDK
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Published as <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">tanvelo</code> on PyPI. Requires zero external packages, leveraging Python&apos;s standard library for fast microservice and container runtimes.
              </p>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-medium text-slate-700">Streaming Example</span>
                  <button
                    onClick={() => copyCode(pyStreamingSnippet, 'stream-py')}
                    className="text-xs font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1"
                  >
                    {copiedKey === 'stream-py' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'stream-py' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                  {pyStreamingSnippet}
                </pre>
              </div>
            </section>

            {/* 5. REST API */}
            <section id="rest-api" className="scroll-mt-20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-sky-600">05</span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Direct HTTP / REST API Reference
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect from any HTTP client by sending a standard POST request:
              </p>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <Badge variant="cyan">POST</Badge>
                  <span className="font-semibold text-slate-900">/v1/chat/completions</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="font-mono font-semibold text-slate-700">Headers:</div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 space-y-0.5">
                    <div>Content-Type: application/json</div>
                    <div>Authorization: Bearer tv_live_...</div>
                    <div>X-Tanvelo-Fallbacks: fallback-provider/your-fallback-model-name</div>
                  </div>
                </div>

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
                        <td className="p-3">Primary model identifier in format &quot;provider/your-model-name&quot;</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-medium text-sky-700">messages</td>
                        <td className="p-3 font-mono text-slate-500">array</td>
                        <td className="p-3 font-semibold text-rose-600">Yes</td>
                        <td className="p-3">Array of message objects with role and content</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-medium text-sky-700">fallbacks</td>
                        <td className="p-3 font-mono text-slate-500">string[]</td>
                        <td className="p-3 text-slate-400">No</td>
                        <td className="p-3">Ordered backup models to execute on failure (e.g. [&quot;fallback-provider/your-fallback-model-name&quot;])</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-medium text-sky-700">stream</td>
                        <td className="p-3 font-mono text-slate-500">boolean</td>
                        <td className="p-3 text-slate-400">No</td>
                        <td className="p-3">If true, returns Server-Sent Events (SSE)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 6. 140+ Providers & Custom Endpoints */}
            <section id="providers-catalog" className="scroll-mt-20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-sky-600">06</span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  140+ AI Providers &amp; Universal Custom Endpoints
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Like LiteLLM, Tanvelo provides out-of-the-box routing and parameter translation across 140+ foundational providers and inference engines. You can invoke any provider using explicit prefix notation (<code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">&lt;provider&gt;/&lt;your-model-name&gt;</code>) or configure automated routing rules.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="font-semibold text-slate-900 text-xs">Prefix Routing Examples</div>
                  <pre className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-200 overflow-x-auto">
{`// Wafer-Scale Fast Silicon
model: "cerebras/your-model-name"

// Open-Weights Provider
model: "together/your-model-name"

// Frontier Reasoning Provider
model: "openai/your-model-name"

// Enterprise Managed Cloud
model: "azure/your-model-name"

// Self-Hosted / On-Prem vLLM
model: "vllm/your-model-name"`}
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="font-semibold text-slate-900 text-xs">Any Custom API / On-Prem Ingress</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Connect ANY private cluster, corporate proxy, or third-party service:
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    <li>Supports any Base URL (e.g. <code className="font-mono text-[10px]">https://llm.corp.net/v1</code>)</li>
                    <li>Flexible auth: Bearer, Azure <code className="font-mono text-[10px]">api-key</code>, custom headers, or unauthenticated local runners</li>
                    <li>Automatic fallback to other providers upon timeouts or outages</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 7. Fallbacks & Circuit Breakers */}
            <section id="fallbacks" className="scroll-mt-20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-sky-600">07</span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Deterministic Fallbacks &amp; Circuit Breakers
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When upstream providers return rate limits (429) or server errors (500/502/503), Tanvelo immediately shifts in-flight execution to your secondary choices in under 180ms without interrupting active streaming connections.
              </p>
            </section>

            {/* 8. Rate Limits & Spend Caps */}
            <section id="rate-limits" className="scroll-mt-20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-sky-600">08</span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Distributed Rate Limits &amp; Spend Caps
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Configure atomic Redis token-bucket limits per API key (RPM/TPM). Monthly budget caps automatically block requests with standard 429 errors when spend ceilings are hit.
              </p>
            </section>

            {/* 9. Webhook Signatures */}
            <section id="webhooks" className="scroll-mt-20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-sky-600">09</span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Webhook Signature Verification (HMAC-SHA256)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tanvelo delivers webhooks with a cryptographically verifiable <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">Tanvelo-Signature</code> header (<code className="text-slate-800 font-mono">t=TIMESTAMP,v1=SIGNATURE</code>).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-slate-700">TypeScript Verification</span>
                    <button
                      onClick={() => copyCode(webhookVerifyTs, 'wh-ts')}
                      className="text-xs font-mono text-slate-500 hover:text-slate-900"
                    >
                      {copiedKey === 'wh-ts' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed">
                    {webhookVerifyTs}
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-slate-700">Python Verification</span>
                    <button
                      onClick={() => copyCode(webhookVerifyPy, 'wh-py')}
                      className="text-xs font-mono text-slate-500 hover:text-slate-900"
                    >
                      {copiedKey === 'wh-py' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed">
                    {webhookVerifyPy}
                  </pre>
                </div>
              </div>
            </section>

            {/* 10. Errors */}
            <section id="errors" className="scroll-mt-20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-sky-600">10</span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  HTTP Status Codes &amp; Error Payloads
                </h2>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                      <th className="p-3">Status Code</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="p-3 font-mono font-semibold text-rose-600">400 Bad Request</td>
                      <td className="p-3 font-mono text-slate-500">invalid_request_error</td>
                      <td className="p-3">Missing required fields or invalid JSON payload</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold text-rose-600">401 Unauthorized</td>
                      <td className="p-3 font-mono text-slate-500">authentication_error</td>
                      <td className="p-3">Missing or invalid Tanvelo API key (must begin with tv_live_)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold text-amber-600">429 Too Many Requests</td>
                      <td className="p-3 font-mono text-slate-500">rate_limit_exceeded</td>
                      <td className="p-3">Rate limit quota exceeded or hard monthly spending budget reached</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold text-rose-600">502 Bad Gateway</td>
                      <td className="p-3 font-mono text-slate-500">upstream_provider_error</td>
                      <td className="p-3">Primary provider and all configured fallbacks failed or timed out</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold text-rose-600">503 Service Unavailable</td>
                      <td className="p-3 font-mono text-slate-500">provider_unavailable</td>
                      <td className="p-3">No provider credentials configured in dashboard for requested model</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-10 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="text-slate-300">|</span>
            <span>&copy; 2026 Tanvelo. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-5 font-mono text-xs">
            <a href="mailto:tanvelo@zohomail.in" className="hover:text-slate-900 transition">
              tanvelo@zohomail.in
            </a>
            <a href="https://x.com/tanvelo_xyz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-slate-900 transition">
              <XSocialIcon className="w-3.5 h-3.5" />
              <span>@tanvelo_xyz</span>
            </a>
            <a href="https://instagram.com/tanvelo_xyz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-slate-900 transition">
              <InstagramIcon className="w-3.5 h-3.5" />
              <span>@tanvelo_xyz</span>
            </a>
            <Link href="/privacy" className="hover:text-slate-900 transition font-sans">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 transition font-sans">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
