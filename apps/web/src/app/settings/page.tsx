'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Database, Zap, Lock, ShieldCheck, Server } from 'lucide-react';

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Infrastructure health, database status, and data security controls.
        </p>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Database */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm">Database</CardTitle>
              </div>
              <Badge variant={settings?.database?.connected ? 'success' : 'destructive'}>
                {settings?.database?.connected ? 'Connected' : 'Offline'}
              </Badge>
            </div>
            <CardDescription>PostgreSQL Storage</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1.5">
            <p>Engine: {settings?.database?.engine || 'Neon Serverless PostgreSQL'}</p>
            <p>Pooling: Transaction Pooler Active</p>
            <p>Isolation: Project-level schema segregation</p>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-600" />
                <CardTitle className="text-sm">Rate Limiting</CardTitle>
              </div>
              <Badge variant="cyan">Active</Badge>
            </div>
            <CardDescription>Distributed counter engine</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1.5">
            <p>Algorithm: Fixed-window sliding rate limiter</p>
            <p>Policy: Per-token and per-project limits</p>
            <p>Headers: RFC-compliant retry indicators</p>
          </CardContent>
        </Card>

        {/* Cryptography */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600" />
                <CardTitle className="text-sm">Encryption</CardTitle>
              </div>
              <Badge variant="purple">AES-256-GCM</Badge>
            </div>
            <CardDescription>Secret Protection</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1.5">
            <p>Keys: AES-256-GCM authenticated cipher</p>
            <p>Tokens: SHA-256 hashing for API keys</p>
            <p>Signatures: HMAC-SHA256 for webhooks</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Retention & Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Data Privacy & Redaction</CardTitle>
          <CardDescription>Policies governing request payload handling and security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <span className="font-medium text-slate-900 block">Header Redaction</span>
              <span className="text-[11px] text-slate-500">
                Authorization tokens and provider API keys are redacted from logs
              </span>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <span className="font-medium text-slate-900 block">Payload Bounds</span>
              <span className="text-[11px] text-slate-500">
                Log entries are safely bounded to prevent database storage bloat
              </span>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-medium text-slate-900 block">SSRF Webhook Guard</span>
              <span className="text-[11px] text-slate-500">
                Blocks outbound webhook calls to local or private IP addresses
              </span>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
