import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  EyeOff,
  Server,
  Database,
  CheckCircle2,
  Key,
  FileText,
  Mail,
  ExternalLink,
  UserCheck,
  Trash2,
  Shield,
  AlertCircle
} from 'lucide-react';
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

        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cyan">Legal & Compliance</Badge>
            <Badge variant="outline">Google OAuth Verified Compliance</Badge>
            <span className="text-xs font-mono text-slate-400">
              Effective: October 20, 2026 · Last Updated: October 24, 2026
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            This Privacy Policy governs the manner in which Tanvelo (&quot;Tanvelo&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operating via{' '}
            <a href="https://www.tanvelo.xyz" className="text-sky-600 hover:underline font-medium">https://www.tanvelo.xyz</a>, collects, uses, maintains, protects, and discloses information collected from users, developers, and organizations utilizing the Tanvelo LLM Federation Gateway, dashboard console, client SDKs, and authentication services (including Google OAuth).
          </p>
        </div>

        {/* Core Architectural Privacy Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 mb-2">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-xs">Zero-Retention In-Flight</h3>
            <p className="text-[11px] text-slate-600 leading-normal">
              We never store, inspect, or log customer prompts or AI completion outputs by default.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-xs">Google API Compliance</h3>
            <p className="text-[11px] text-slate-600 leading-normal">
              Strict adherence to Google API Services User Data Policy, including Limited Use terms.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-xs">AES-256-GCM Encryption</h3>
            <p className="text-[11px] text-slate-600 leading-normal">
              Upstream API keys are encrypted at rest with authenticated ciphers. Keys are never logged.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 mb-2">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-xs">User Control &amp; Deletion</h3>
            <p className="text-[11px] text-slate-600 leading-normal">
              Instant self-serve account deletion, data purge, and Google OAuth permission revocation.
            </p>
          </div>
        </div>

        {/* Detailed Policy Content */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>1. Application Identity &amp; Service Overview</span>
            </h2>
            <p>
              Tanvelo is an intelligent, high-availability developer infrastructure platform and LLM API Gateway. Tanvelo provides unified API routing, automatic failover, distributed rate limiting, and cost estimation across leading artificial intelligence providers (including OpenAI, Anthropic Claude, Google Gemini, Groq, DeepSeek, Mistral AI, Cohere, and local/on-premise endpoints).
            </p>
            <p>
              This Privacy Policy applies to our website (<a href="https://www.tanvelo.xyz" className="text-sky-600 hover:underline">https://www.tanvelo.xyz</a>), web console, official client SDKs (such as <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">@tanvelo/sdk</code> and <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">tanvelo.py</code>), and API routing services (collectively, the &quot;Service&quot;).
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">2. Information We Collect</h2>
            <p>
              We collect information in three ways: information you provide directly, information received when you authenticate via third-party identity providers (such as Google OAuth), and operational technical telemetry generated when you use our services.
            </p>

            <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-slate-200">
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">A. Account &amp; Identity Data</h3>
                <p className="text-slate-600">
                  When you register for a Tanvelo account, we collect your name, email address, password hash (managed securely via our identity provider), and company or organization name.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">B. Information Received from Google OAuth (Sign-In with Google)</h3>
                <p className="text-slate-600">
                  If you choose to register or authenticate using your Google account via Google OAuth 2.0, we request permission to access basic profile and identity information under the standard <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">openid</code>, <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">email</code>, and <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">profile</code> scopes. We collect and process the following Google user data:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 pt-1">
                  <li><strong>Google Account Email Address:</strong> Used as your primary account identifier, to verify your identity, and to transmit essential transactional alerts.</li>
                  <li><strong>Full Name &amp; Given Name:</strong> Used to personalize your account profile and display team collaborator information within project workspaces.</li>
                  <li><strong>Google Profile Picture / Avatar URL:</strong> Used solely to display your user profile picture in the dashboard navigation bar.</li>
                  <li><strong>Google Unique User Identifier (<code className="font-mono text-xs">sub</code>):</strong> A unique token provided by Google to bind your Google credentials to your Tanvelo account across login sessions.</li>
                </ul>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">C. Upstream Provider Credentials &amp; Project Configurations</h3>
                <p className="text-slate-600">
                  To route requests to your chosen AI providers, you may provide your upstream API keys (e.g., Google Gemini API key, OpenAI key, Anthropic token). These keys are encrypted immediately using AES-256-GCM authenticated encryption and stored in our protected database.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">D. In-Flight Inference Data &amp; Zero Body Retention Guarantee</h3>
                <p className="text-slate-600">
                  By default, Tanvelo operates with <strong>Zero Body Retention</strong> (<code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">LOG_PAYLOADS=false</code>). When your application dispatches inference requests through <code className="text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded text-xs">POST /v1/chat/completions</code>:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 pt-1">
                  <li>Prompts, chat messages, system instructions, and LLM completion responses are processed exclusively in transient RAM memory and streamed directly back to your client.</li>
                  <li>We <strong>do not store</strong>, inspect, copy, or retain prompt text or AI response text on persistent disks or in databases.</li>
                  <li>Only high-level operational execution metadata is recorded: timestamp, request ID, target provider name, model identifier, token counts, latency in milliseconds, and HTTP status code.</li>
                </ul>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">E. Technical &amp; Diagnostic Data</h3>
                <p className="text-slate-600">
                  We automatically collect technical data necessary for network security and rate-limiting enforcement, including IP addresses, browser user-agent strings, operating system, and system error logs.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">3. How We Use Your Information</h2>
            <p>We use the data we collect solely for the following legitimate business and operational purposes:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Authentication &amp; Account Provisioning:</strong> Authenticating your identity via direct credentials or Google OAuth, establishing and maintaining your project workspaces, and preventing unauthorized account takeover.</li>
              <li><strong>Executing Gateway Services:</strong> Validating Tanvelo Bearer API keys, enforcing project rate limits and monthly budget caps, routing inference requests, and managing fallback circuit breakers.</li>
              <li><strong>Transactional Notifications:</strong> Sending essential service notifications, including password resets, OAuth verification notices, security incident advisories, and usage quota warnings.</li>
              <li><strong>Customer Support &amp; Debugging:</strong> Investigating system errors, diagnosing gateway downtime, and responding to developer support tickets.</li>
              <li><strong>Platform Security &amp; Defense:</strong> Detecting and mitigating DDoS attacks, malicious bot traffic, Server-Side Request Forgery (SSRF) attempts, and abusive activity.</li>
            </ul>
            <p className="font-semibold text-slate-800 pt-1">
              We never sell, rent, or lease your personal data or Google user data to any third party for marketing or advertising purposes.
            </p>
          </section>

          {/* Section 4 - GOOGLE API SERVICES USER DATA POLICY COMPLIANCE */}
          <section className="p-6 rounded-xl bg-sky-50/70 border-2 border-sky-200 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-700" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                4. Google API Services User Data Policy Compliance &amp; Limited Use Disclosure
              </h2>
            </div>
            
            <p className="text-slate-800 font-medium">
              Tanvelo adheres strictly to the Google API Services User Data Policy regarding data accessed via Google OAuth.
            </p>

            <div className="p-4 rounded-lg bg-white border border-sky-200 shadow-2xs space-y-2">
              <p className="font-semibold text-slate-900">
                Mandatory Limited Use Statement:
              </p>
              <p className="italic text-slate-800 border-l-4 border-sky-500 pl-3 py-1 bg-slate-50 rounded-r">
                &quot;Tanvelo&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-700 font-semibold underline hover:text-sky-800 inline-flex items-center gap-1"
                >
                  Google API Services User Data Policy
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
                , including the Limited Use requirements.&quot;
              </p>
            </div>

            <div className="space-y-2 pt-1 text-slate-700">
              <p className="font-semibold text-slate-900">Strict Restrictions on Google User Data:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>No Advertising or Marketing:</strong> Information received from Google APIs is never used, transferred, or disclosed for serving advertisements, including personalized, contextual, retargeted, or interest-based advertising.
                </li>
                <li>
                  <strong>No AI/ML Model Training:</strong> Information received from Google APIs (including profile data and any associated account metadata) is <strong>never used</strong> to train, fine-tune, improve, or evaluate generalized machine learning (ML) or artificial intelligence (AI) models.
                </li>
                <li>
                  <strong>No Sale of Google User Data:</strong> Tanvelo does not sell, rent, license, or monetize Google user data under any circumstance.
                </li>
                <li>
                  <strong>Restricted Third-Party Transfers:</strong> We only transfer Google user data to third parties if strictly necessary to provide the service (such as our certified identity infrastructure subprocessor, Clerk), to comply with applicable laws, or as part of a merger or acquisition with prior notice.
                </li>
                <li>
                  <strong>Human Access Restrictions:</strong> Tanvelo personnel and contractors do not view or read your Google user data unless: (1) you provide express, affirmative consent for troubleshooting or customer support, (2) it is strictly necessary to investigate security breaches or technical fraud, or (3) required by binding legal process.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">5. Cryptographic Security &amp; Data Protection</h2>
            <p>We employ enterprise-grade cryptographic controls to safeguard customer data and credentials:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>End-to-End Transport Security:</strong> All communications with the Tanvelo website, developer dashboard, and API endpoints require TLS 1.3 / HTTPS encryption. Unencrypted HTTP traffic is rejected.
              </li>
              <li>
                <strong>Authenticated Secret Encryption:</strong> Upstream provider API keys are encrypted at rest in PostgreSQL utilizing authenticated AES-256-GCM ciphers with unique initialization vectors (IV) and authentication tags. Decryption occurs only in volatile memory immediately prior to upstream dispatch.
              </li>
              <li>
                <strong>Irreversible API Key Hashing:</strong> Client gateway API keys (<code className="font-mono text-xs">tv_live_...</code>) are never stored in plaintext. We store exclusively the one-way salted SHA-256 hash. Plaintext keys cannot be retrieved, even by internal database administrators.
              </li>
              <li>
                <strong>Network Egress &amp; SSRF Guardrails:</strong> Custom provider URLs and outbound webhooks strictly enforce application-level SSRF defenses, automatically blocking RFC1918 private subnets (<code className="font-mono text-xs">10.0.0.0/8</code>, <code className="font-mono text-xs">172.16.0.0/12</code>, <code className="font-mono text-xs">192.168.0.0/16</code>), loopback interfaces (<code className="font-mono text-xs">127.0.0.1</code>), and cloud metadata endpoints (<code className="font-mono text-xs">169.254.169.254</code>).
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">6. Third-Party Subprocessors &amp; Disclosures</h2>
            <p>
              To deliver our high-performance infrastructure, we partner with trusted, SOC-2 compliant subprocessors. Each subprocessor is bound by rigorous contractual data processing agreements (DPAs):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">Clerk, Inc.</span>
                <p className="text-slate-600">User identity management, OAuth session tokens, and multi-factor authentication infrastructure.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">Cloud Database &amp; Compute</span>
                <p className="text-slate-600">Enterprise cloud hosting for encrypted credential databases, rate-limit state, and telemetry.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">Upstream AI Providers</span>
                <p className="text-slate-600">Direct execution targets (OpenAI, Anthropic, Google Gemini, Groq, DeepSeek) governed by your respective enterprise agreements.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">Zoho Mail Infrastructure</span>
                <p className="text-slate-600">Encrypted transmission of transactional emails, account recovery links, and customer support communications.</p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">7. Data Retention &amp; User Control (Account Deletion &amp; Revocation)</h2>
            <p>
              We retain personal data and project metadata only for as long as your account remains active or as required to fulfill legitimate contractual and legal obligations.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Account &amp; Data Deletion
                </span>
                <p className="text-slate-600">
                  You may permanently delete your account at any time through the <strong>Account Settings</strong> page in your Tanvelo console, or by sending a written deletion request to{' '}
                  <a href="mailto:tanvelo@zohomail.in" className="text-sky-600 underline font-medium">tanvelo@zohomail.in</a>.
                  Upon account deletion, all personal data, project metadata, encrypted provider API keys, and access logs associated with your account are permanently purged from active systems within 30 days.
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Revoking Google OAuth Access
                </span>
                <p className="text-slate-600">
                  You can disconnect Tanvelo and revoke its access to your Google account at any time by visiting your Google Security settings:{' '}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 underline font-medium inline-flex items-center gap-0.5"
                  >
                    https://myaccount.google.com/permissions
                    <ExternalLink className="w-2.5 h-2.5 inline" />
                  </a>
                  . Once revoked, Tanvelo will immediately lose all ability to access your Google account information.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">8. Privacy Rights under GDPR &amp; CCPA / CPRA</h2>
            <p>
              Depending on your jurisdiction, you possess specific legal rights regarding your personal information:
            </p>

            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 text-xs">European Economic Area (GDPR) &amp; UK:</h3>
              <p className="text-slate-600">
                You have the right to access the personal data we hold about you, request rectification of inaccurate data, request erasure (&quot;Right to be Forgotten&quot;), restrict or object to our processing, and request data portability. Our legal basis for processing your data includes contractual necessity (to provide the service), legitimate interests (platform security and performance), and consent (for OAuth authorization).
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <h3 className="font-semibold text-slate-900 text-xs">California Residents (CCPA / CPRA):</h3>
              <p className="text-slate-600">
                Under the California Consumer Privacy Act (CCPA) as amended by the CPRA, California residents have the right to know what personal information we collect, the right to request deletion, the right to correct inaccurate personal data, and the right not to receive discriminatory treatment for exercising these rights.
              </p>
              <p className="text-slate-600 font-medium">
                We confirm that <strong>Tanvelo does not sell or share personal information</strong> (as those terms are defined under the CCPA/CPRA), including data obtained through Google APIs.
              </p>
            </div>

            <p className="text-slate-600 pt-1">
              To exercise any of these privacy rights, contact our Data Protection Team at{' '}
              <a href="mailto:tanvelo@zohomail.in" className="text-sky-600 underline font-medium">tanvelo@zohomail.in</a>. We respond to verified requests within thirty (30) days.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">9. Children&apos;s Privacy (COPPA Compliance)</h2>
            <p>
              Our Service is strictly designed for developers, engineering teams, and enterprise businesses. Tanvelo does not knowingly solicit or collect personal information from individuals under the age of 13 (or under 16 in the European Union). If we become aware that an individual under the age of 13 has registered or provided personal information, we will immediately delete such data and terminate the account.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect operational modifications, legal mandates, or updates to third-party integration policies (such as Google API Services policies). When revisions occur, we will update the &quot;Last Updated&quot; date at the top of this page. For material updates affecting data handling practices, we will provide prominent notice via email or a dashboard banner prior to the change taking effect.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">11. Contact Information &amp; Data Protection Office</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, our Google OAuth data compliance, or our Zero-Retention architecture, please contact us:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <p className="font-semibold text-slate-900">Tanvelo Trust, Safety &amp; Privacy Office</p>
              <p className="text-slate-600">Application: Tanvelo LLM Federation Gateway</p>
              <p className="text-slate-600">Website: <a href="https://www.tanvelo.xyz" className="text-sky-600 hover:underline">https://www.tanvelo.xyz</a></p>
              <p className="text-slate-600">Privacy Policy URL: <a href="https://www.tanvelo.xyz/privacy" className="text-sky-600 hover:underline">https://www.tanvelo.xyz/privacy</a></p>
              <p className="text-slate-600">
                Email:{' '}
                <a href="mailto:tanvelo@zohomail.in" className="text-sky-600 hover:text-sky-700 hover:underline font-semibold">
                  tanvelo@zohomail.in
                </a>
              </p>
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
