'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, EyeOff, Server, Database, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <Logo size="sm" />
        </div>

        {/* Header Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Legal & Trust</Badge>
            <span className="text-xs font-mono text-slate-400">Effective Date: October 20, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            This Privacy Policy describes how Tanvelo LLM Federation Gateway (&quot;Tanvelo&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) protects developer credentials, sanitizes request telemetry, and handles in-flight inference traffic.
          </p>
        </div>

        {/* Core Architectural Privacy Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 mb-2">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-xs">Zero-Training Policy</h3>
            <p className="text-[11px] text-slate-600 leading-normal">
              We never train, fine-tune, or synthesize models on your customer prompts or gateway completions.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-xs">Hardware Encryption</h3>
            <p className="text-[11px] text-slate-600 leading-normal">
              Upstream API keys are encrypted at rest with authenticated AES-256-GCM. Raw keys are never logged.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 mb-2">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-xs">Header Sanitization</h3>
            <p className="text-[11px] text-slate-600 leading-normal">
              Authorization tokens, bearer secrets, and private metadata are redacted before persistence.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Nature of the Gateway Service</h2>
            <p>
              Tanvelo acts as a high-performance proxy and routing plane between your applications and upstream LLM providers (including OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Groq, Mistral AI, and self-hosted inference nodes like Ollama and vLLM).
            </p>
            <p>
              When your application dispatches a request to <code className="text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded text-xs">POST /v1/chat/completions</code>, Tanvelo inspects routing policies, verifies rate limits, and forwards the payload over secure TLS (HTTPS) to the selected provider.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">2. In-Flight Inference Data & Zero Prompt Retention</h2>
            <p>
              By default, Tanvelo does not store or retain prompt payloads or model completion bodies in the database (<code className="text-slate-800 font-mono">LOG_PAYLOADS=false</code>). In-flight streams are processed in transient RAM and piped directly back to the client application via Server-Sent Events (SSE) or chunked HTTP responses.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Metadata Logging:</strong> Only operational execution metadata is logged (request ID, model name, provider target, token counts, total latency, and HTTP status code).</li>
              <li><strong>Payload Redaction:</strong> In environments where operator payload debugging is explicitly enabled, sensitive authorization headers (including <code className="text-slate-800 font-mono">Authorization</code>, <code className="text-slate-800 font-mono">x-api-key</code>) are permanently sanitized before write.</li>
              <li><strong>No Data Sales:</strong> We do not sell, rent, or monetize your requests or completions.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">3. Cryptographic Key Management</h2>
            <p>
              Upstream provider credentials (such as your OpenAI API Key or Anthropic secret) are stored encrypted in PostgreSQL using industry-standard AES-256-GCM authenticated encryption with unique initialization vectors and authentication tags verified prior to decryption.
            </p>
            <p>
              Gateway API keys provided to your client applications are never stored in plaintext. We store only the one-way SHA-256 hash. Even in the event of an unauthorized database dump, raw gateway keys cannot be derived.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">4. Third-Party Provider Disclosures</h2>
            <p>
              When Tanvelo routes a request to an upstream provider (e.g., Anthropic or OpenAI), the transmission of data to that provider is governed by that provider&apos;s respective privacy policy and enterprise data processing agreement (DPA). We encourage you to review their specific commercial terms:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">OpenAI Enterprise Privacy Policy</div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">Anthropic Commercial Terms of Service</div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">Google Cloud Vertex AI & Gemini Privacy</div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">Local / On-Premise Ollama (Zero Egress)</div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">5. Egress & SSRF Security Guardrails</h2>
            <p>
              To protect internal enterprise networks, Tanvelo webhooks and custom provider endpoints strictly enforce SSRF (Server-Side Request Forgery) egress protections. Destination IP addresses resolving to loopback (<code className="text-slate-800 font-mono">127.0.0.1</code>), RFC1918 private subnets (<code className="text-slate-800 font-mono">10.0.0.0/8</code>, <code className="text-slate-800 font-mono">192.168.0.0/16</code>), or cloud instance metadata services (<code className="text-slate-800 font-mono">169.254.169.254</code>) are blocked by application-level egress security validation before network dispatch.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">6. Compliance with GDPR & CCPA</h2>
            <p>
              Depending on your location, you may have rights under the European General Data Protection Regulation (GDPR) or the California Consumer Privacy Act (CCPA), including the right to request deletion of your project workspace metadata or exported analytics.
            </p>
            <p>
              Because Tanvelo operates primarily as a Data Processor on behalf of developer teams, inquiries regarding end-user personal data processed via LLM prompts should be directed to the application controller.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">7. Contact Information</h2>
            <p>
              For security questions, cryptographic disclosures, or privacy requests, please reach out to our security team:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <p className="font-semibold text-slate-900">Tanvelo Trust & Safety Office</p>
              <p className="text-slate-600">Email: security@tanvelo.com</p>
              <p className="text-slate-600">PGP Key ID: 0x948F2BE1A</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200">
          <p>© 2026 Tanvelo LLM Federation Gateway. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-900 transition">Terms of Service</Link>
            <Link href="/docs" className="hover:text-slate-900 transition">Documentation</Link>
            <Link href="/overview" className="hover:text-slate-900 transition">Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
