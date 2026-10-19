'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatLatency, formatNumber } from '@/lib/utils';
import {
  Activity,
  CheckCircle2,
  Clock,
  DollarSign,
  Cpu,
  ArrowUpRight,
  Inbox,
  Sparkles,
  Zap,
  Play,
  Terminal,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function OverviewPage() {
  const { currentProject, currentEnvironment } = useProject();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick live test drawer/state
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  const fetchData = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const envParam = currentEnvironment ? `&environmentId=${currentEnvironment.id}` : '';
      const [analyticsRes, requestsRes, providersRes] = await Promise.all([
        fetch(`/api/analytics?projectId=${currentProject.id}${envParam}&days=7`),
        fetch(`/api/requests?projectId=${currentProject.id}${envParam}&limit=6`),
        fetch(`/api/providers?projectId=${currentProject.id}`),
      ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (requestsRes.ok) {
        const reqData = await requestsRes.json();
        setRecentRequests(reqData.data || []);
      }
      if (providersRes.ok) setProviders(await providersRes.json());
    } catch (err) {
      console.error('Error fetching overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentProject, currentEnvironment]);

  const summary = analytics?.summary || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    successRate: 0,
    averageLatencyMs: 0,
    p95LatencyMs: 0,
    totalTokens: 0,
    totalCost: 0,
  };

  const COLORS = ['#38BDF8', '#818CF8', '#34D399', '#FBBF24', '#F43F5E', '#A78BFA'];

  const connectedProviders = providers.filter(
    (p) => p.status === 'connected' || (p.apiKeyPreview && p.apiKeyPreview !== 'None')
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Welcome & Quick Status Strip */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0C1222] via-[#0F172A] to-[#121028] p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-48 -mb-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="cyan" className="font-mono text-[10px]">
                Active Gateway
              </Badge>
              <span className="text-xs text-slate-400 font-mono">v1.0.0 Stable</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Tanvelo LLM Command Center
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Real-time telemetry, deterministic routing, and cost control for{' '}
              <span className="text-cyan-400 font-semibold">{currentProject?.name}</span> (
              <span className="text-blue-400">{currentEnvironment?.name || 'Production'}</span>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={fetchData} loading={loading}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Live
            </Button>

            <Link
              href="/docs"
              className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 border border-blue-500/50 px-4 py-2 rounded-lg font-medium shadow-md shadow-blue-500/20 transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Quickstart Docs</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Live System Diagnostics Ribbon */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Gateway Port:</span>
            <span className="text-slate-200 font-mono font-medium">:4000 Live</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">Storage Engine:</span>
            <span className="text-slate-200 font-medium">Neon PostgreSQL (Serverless)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-slate-400">Encryption:</span>
            <span className="text-slate-200 font-medium">AES-256-GCM</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Rate Limiter:</span>
            <span className="text-slate-200 font-medium">Redis 7 Atomic</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <Card className="relative overflow-hidden group hover:border-blue-500/50 transition">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Volume (7d)</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1 font-mono tracking-tight">
                {formatNumber(summary.totalRequests)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                <span>Persisted gateway logs</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400 group-hover:scale-105 transition shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Success Rate</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1 font-mono tracking-tight">
                {summary.totalRequests > 0 ? `${summary.successRate}%` : '—'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {summary.totalRequests > 0 ? `${summary.successfulRequests} successful` : 'No requests yet'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Latency (Avg & P95) */}
        <Card className="relative overflow-hidden group hover:border-cyan-500/50 transition">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Average Latency</p>
              <h3 className="text-2xl font-black text-cyan-400 mt-1 font-mono tracking-tight">
                {summary.totalRequests > 0 ? formatLatency(summary.averageLatencyMs) : '—'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                {summary.totalRequests > 0 ? `P95: ${formatLatency(summary.p95LatencyMs)}` : 'Exact provider latency'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Estimated Spend */}
        <Card className="relative overflow-hidden group hover:border-purple-500/50 transition">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Estimated Cost</p>
              <h3 className="text-2xl font-black text-purple-400 mt-1 font-mono tracking-tight">
                {formatCurrency(summary.totalCost)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {summary.totalTokens > 0 ? `${formatNumber(summary.totalTokens)} tokens` : 'From token accounting'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition shadow-sm">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost & Volume Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Request Volume & Cost Trend</CardTitle>
              <CardDescription>Daily execution volume over the past 7 days</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              Persisted Records Only
            </Badge>
          </CardHeader>
          <CardContent className="h-72">
            {analytics?.timeSeries && analytics.timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeSeries}>
                  <defs>
                    <linearGradient id="reqGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    name="Requests"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#reqGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Inbox className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-medium">No request activity recorded yet.</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm text-center">
                  Traffic from <code className="text-cyan-400 font-mono">POST /v1/chat/completions</code> will chart here automatically.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Provider Breakdown Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Traffic by Provider</CardTitle>
            <CardDescription>Share of gateway volume per provider</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex flex-col items-center justify-center">
            {analytics?.byProvider && analytics.byProvider.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.byProvider}
                    dataKey="count"
                    nameKey="provider"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={55}
                    paddingAngle={4}
                  >
                    {analytics.byProvider.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500">
                <Cpu className="w-8 h-8 mb-2 mx-auto opacity-50" />
                <p className="text-xs font-medium">No provider distribution yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {connectedProviders.length} connected provider(s) ready.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upstream Connected Providers Strip */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Connected AI Providers</CardTitle>
              <Badge variant="cyan" className="font-mono text-[10px]">
                {connectedProviders.length} Active
              </Badge>
            </div>
            <CardDescription>
              Hardware-isolated AES-256-GCM proxy links across cloud and local engines
            </CardDescription>
          </div>
          <Link
            href="/providers"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            Manage Providers <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {connectedProviders.length === 0 ? (
            <div className="py-6 px-4 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">
                No active provider connections linked yet.
              </p>
              <Link
                href="/providers"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                Connect OpenRouter, Gemini, OpenAI, Claude, or local models &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {connectedProviders.slice(0, 8).map((conn) => {
                const isOnline = conn.status === 'connected';
                return (
                  <Link
                    key={conn.id}
                    href="/providers"
                    className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center font-bold uppercase text-xs text-cyan-300 flex-shrink-0">
                        {conn.provider.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-200 capitalize truncate group-hover:text-cyan-400 transition">
                          {conn.customName || conn.provider}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono block truncate">
                          {conn.apiKeyPreview || '••••••••'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isOnline ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Gateway Requests</CardTitle>
            <CardDescription>Live telemetry from client applications</CardDescription>
          </div>
          <Link
            href="/requests"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            All Requests History <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <EmptyState
              title="No requests have been recorded yet"
              description="Make a request to POST /v1/chat/completions using your Tanvelo API key to see live requests appear here."
              actionLabel="Open Quickstart Guide"
              onAction={() => {
                window.location.href = '/docs';
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-3 font-medium">Request ID</th>
                    <th className="pb-3 font-medium">Provider & Model</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Total Latency</th>
                    <th className="pb-3 font-medium">Tokens</th>
                    <th className="pb-3 font-medium">Cost (Est.)</th>
                    <th className="pb-3 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 font-mono text-slate-300">
                        <Link href={`/requests/${req.requestId}`} className="hover:text-cyan-400 hover:underline">
                          {req.requestId.slice(0, 18)}...
                        </Link>
                      </td>
                      <td className="py-3.5 text-slate-200">
                        <span className="font-semibold capitalize text-slate-200">{req.provider}</span>
                        <span className="text-slate-400 ml-1.5 font-mono text-[11px]">({req.model})</span>
                      </td>
                      <td className="py-3.5">
                        <Badge
                          variant={
                            req.status === 'success'
                              ? 'success'
                              : req.status === 'rate_limited'
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {req.statusCode} {req.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-slate-300 font-mono">{formatLatency(req.totalLatencyMs)}</td>
                      <td className="py-3.5 text-slate-300 font-mono">{formatNumber(req.totalTokens)}</td>
                      <td className="py-3.5 text-slate-300 font-mono">{formatCurrency(req.estimatedCost)}</td>
                      <td className="py-3.5 text-slate-500 text-right">
                        {new Date(req.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
