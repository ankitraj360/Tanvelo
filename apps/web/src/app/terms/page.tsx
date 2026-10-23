'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Shield, AlertTriangle, Scale, CheckCircle2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';

export default function TermsOfServicePage() {
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

        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Terms of Service</Badge>
            <span className="text-xs font-mono text-slate-400">Last Modified: October 20, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            Please read these Terms of Service carefully before integrating or utilizing the Tanvelo LLM Federation Gateway API, client SDKs, or control dashboard.
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 mb-2">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-xs">Developer Terms</h3>
            <p className="text-[11px] text-slate-600 leading-normal">
              Commercial agreement for programmatic API access, team workspaces, and production workloads.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 mb-2">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-xs">Upstream Compliance</h3>
            <p className="text-[11px] text-slate-600 leading-normal">
              Requests routed through Tanvelo must adhere to the acceptable use rules of each respective provider.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 mb-2">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-xs">Deterministic Fallbacks</h3>
            <p className="text-[11px] text-slate-600 leading-normal">
              Automated circuit breakers failover requests transparently based on your project configuration.
            </p>
          </div>
        </div>

        {/* Legal Text Body */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Acceptance & Authority</h2>
            <p>
              By accessing, deploying, or utilizing the Tanvelo LLM Federation Gateway (&quot;Tanvelo&quot;), including our API endpoints (<code className="text-slate-800 font-mono">/v1/chat/completions</code>), client SDKs (<code className="text-slate-800 font-mono">@tanvelo/sdk</code>, <code className="text-slate-800 font-mono">tanvelo.py</code>), or web management console, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms of Service.
            </p>
            <p>
              If you are entering into this agreement on behalf of a company, organization, or other legal entity, you represent and warrant that you possess the legal authority to bind such entity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">2. Account & Gateway API Key Security</h2>
            <p>
              Access to the gateway proxy requires an authenticated Bearer API Key generated through your Tanvelo project workspace. You are solely responsible for safeguarding your keys.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>You agree not to share, publicize, or hard-code raw API keys in client-side bundles, public repositories, or client browsers.</li>
              <li>You agree to immediately revoke any API key that you suspect has been compromised via the API Keys dashboard.</li>
              <li>Tanvelo stores only one-way SHA-256 hashes of gateway keys and cannot retrieve lost plaintext credentials.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">3. Acceptable Use & Prohibited Activities</h2>
            <p>
              You agree to use Tanvelo strictly for lawful purposes and in compliance with all relevant laws, export controls, and regulations. You shall not, directly or indirectly:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Use the gateway to generate, propagate, or facilitate malware, ransomware, weapon design, or unauthorized cyber intrusions.</li>
              <li>Disrupt, flood, or mount Denial-of-Service (DDoS) attacks against the gateway proxy or upstream LLM provider infrastructure.</li>
              <li>Circumvent or tamper with rate limits, token metering, budget caps, or billing telemetry.</li>
              <li>Attempt Server-Side Request Forgery (SSRF) against private RFC1918 subnets, cloud metadata endpoints, or internal socket boundaries.</li>
              <li>Violate the Acceptable Use Policies of upstream providers (including OpenAI, Anthropic, Google Gemini, DeepSeek, Groq, and Mistral AI).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">4. Multi-Provider Routing & Upstream Dependencies</h2>
            <p>
              Tanvelo facilitates automated load balancing, retries, and fallback routing across multiple third-party providers. You understand and agree that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Upstream providers operate independently and are subject to their own rate limits, system outages, maintenance windows, and content moderation filters.</li>
              <li>Tanvelo does not warrant that upstream providers will maintain continuous, uninterrupted availability.</li>
              <li>When a fallback rule triggers across providers, token consumption and pricing reflect the rates of the executing provider.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">5. Rate Limits & Hard Spend Cutoffs</h2>
            <p>
              To protect both our infrastructure and customer budgets, Tanvelo enforces atomic fixed-window rate limits and budget constraints. When a configured spend threshold or rate limit is reached:
            </p>
            <p>
              Requests are rejected with standard HTTP <code className="text-rose-600 font-mono">429 Too Many Requests</code> status codes (with <code className="text-rose-600 font-mono">Retry-After</code> headers). Tanvelo is not liable for downstream application errors or interrupted workloads caused by enforced rate limits or customer-configured budget caps.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">6. Intellectual Property & Customer Ownership</h2>
            <p>
              As between you and Tanvelo, you retain all ownership rights, title, and interest in your application code, project data, and content submitted through the gateway. Tanvelo does not claim ownership of model generations returned to your applications.
            </p>
            <p>
              All rights in the Tanvelo gateway software, SDKs, logos, documentation, and user interfaces are and remain the exclusive property of Tanvelo and its licensors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">7. Disclaimer of Warranties & Limitation of Liability</h2>
            <p className="uppercase text-[11px] font-mono text-slate-500 tracking-wider">
              Provided &quot;As Is&quot; and &quot;As Available&quot;
            </p>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, TANVELO EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER STATUTORY, EXPRESS, OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              IN NO EVENT SHALL TANVELO BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL) ARISING FROM OR RELATED TO UPSTREAM PROVIDER OUTAGES, NETWORK LATENCY, OR ENFORCED BUDGET TERMINATIONS.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service periodically. We will provide reasonable notice of material updates by posting an announcement in the dashboard or updating the &quot;Last Modified&quot; date above. Your continued programmatic usage of the gateway following notice constitutes acceptance of the amended terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">9. Governing Law & Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law principles. Any dispute arising hereunder shall be subject to the exclusive jurisdiction of the state and federal courts located in Wilmington, Delaware.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200">
          <p>© 2026 Tanvelo LLM Federation Gateway. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-900 transition">Privacy Policy</Link>
            <Link href="/docs" className="hover:text-slate-900 transition">Documentation</Link>
            <Link href="/overview" className="hover:text-slate-900 transition">Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
