'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Database, Zap, Lock, ShieldAlert, Server, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          setSettings(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings & Controls</h1>
        <p className="text-xs text-slate-500 mt-1">
          Infrastructure health diagnostics, cryptographic status, and security network binding.
        </p>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Database */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm">Neon PostgreSQL (Production)</CardTitle>
              </div>
              <Badge variant={settings?.database?.connected ? 'success' : 'destructive'}>
                {settings?.database?.connected ? 'Production Connected' : 'Offline'}
              </Badge>
            </div>
            <CardDescription>Serverless relational storage & transaction pooling</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1">
            <p>Engine: {settings?.database?.engine || 'Neon Serverless PostgreSQL'}</p>
            <p>Pooler: Neon PgBouncer Active with Connection Limits</p>
            <p>Isolation: Strict project segregation enforced</p>
          </CardContent>
        </Card>

        {/* Redis Rate Limiter */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-600" />
                <CardTitle className="text-sm">Redis 7 & Rate Limiting</CardTitle>
              </div>
              <Badge variant="cyan">Atomic Token Bucket</Badge>
            </div>
            <CardDescription>Distributed rate limiting infrastructure</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1">
            <p>Engine: Redis 7 with atomic INCR/EXPIRE</p>
            <p>Fallback: In-memory sliding window cache</p>
            <p>Headers: RFC-compliant rate limit headers</p>
          </CardContent>
        </Card>

        {/* Encryption Engine */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600" />
                <CardTitle className="text-sm">Cryptographic Controls</CardTitle>
              </div>
              <Badge variant="purple">AES-256-GCM</Badge>
            </div>
            <CardDescription>Server-side secret protection</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1">
            <p>Algorithm: AES-256-GCM with auth tags</p>
            <p>Key Storage: SHA-256 hashing for API keys</p>
            <p>Webhooks: HMAC-SHA256 signature verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Architecture Notice (PRD Section 19) */}
      <Card className="border-amber-200 bg-amber-50/70">
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-700">
            <ShieldAlert className="w-5 h-5" />
            <CardTitle className="text-amber-900">
              Security Architecture: Dashboard Authentication Exclusion
            </CardTitle>
          </div>
          <CardDescription className="text-amber-700/80">
            Compliance specification per PRD Section 19.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-slate-700 space-y-3 leading-relaxed">
          <p>
            Per specification, dashboard login, password authentication, and OAuth accounts are <strong>explicitly excluded</strong>. Gateway requests are authenticated using Bearer API keys, whereas the management dashboard operates under a local/private network trust boundary.
          </p>

          <div className="p-3.5 rounded-lg bg-white border border-amber-200/80 shadow-sm space-y-2 text-[11px]">
            <span className="font-semibold text-slate-900 block">Production Deployment Mandates:</span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>
                The management dashboard and its API routes (<code className="text-blue-700 font-mono">/api/*</code>) must be bound strictly to <code className="text-blue-700 font-mono">127.0.0.1</code> or an internal VPN / trusted private network.
              </li>
              <li>
                Only the unified gateway endpoint (<code className="text-blue-700 font-mono">POST /v1/chat/completions</code>) should be exposed publicly through a reverse proxy.
              </li>
              <li>
                Never expose management routes publicly without mutual TLS, internal network VPC rules, or network access control lists.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention & Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Data Privacy & Log Redaction</CardTitle>
          <CardDescription>Settings governing sensitive payload handling</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700">
          <div className="flex items-center justify-between py-2 border-b border-slate-200">
            <div>
              <span className="font-medium text-slate-900 block">Header Redaction</span>
              <span className="text-[11px] text-slate-500">
                Authorization, API Keys, and secret tokens are replaced with [REDACTED]
              </span>
            </div>
            <Badge variant="success">Enforced</Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-200">
            <div>
              <span className="font-medium text-slate-900 block">Prompt Payload Truncation</span>
              <span className="text-[11px] text-slate-500">
                Log entries over 5,000 characters are safely bounded to prevent database bloat
              </span>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-medium text-slate-900 block">SSRF Webhook Guard</span>
              <span className="text-[11px] text-slate-500">
                Blocks destination IPs resolving to RFC1918, 127.0.0.1, or cloud metadata
              </span>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
