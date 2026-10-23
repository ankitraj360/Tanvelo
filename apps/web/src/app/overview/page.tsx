'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatLatency, formatNumber, parseApiResponse } from '@/lib/utils';
import {
  Activity,
  CheckCircle2,
  Clock,
  DollarSign,
  Cpu,
  ArrowUpRight,
  Inbox,
  Terminal,
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

      if (analyticsRes.ok) setAnalytics(await parseApiResponse(analyticsRes));
      if (requestsRes.ok) {
        const reqData = await parseApiResponse(requestsRes);
        setRecentRequests(reqData.data || []);
      }
      if (providersRes.ok) setProviders(await parseApiResponse(providersRes));
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

  const COLORS = ['#0284C7', '#4F46E5', '#16A34A', '#D97706', '#E11D48', '#8B5CF6'];

  const connectedProviders = providers.filter(
    (p) => p.status === 'connected' || (p.apiKeyPreview && p.apiKeyPreview !== 'None')
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time metrics, request volume, and costs for{' '}
            <span className="text-slate-800 font-medium">{currentProject?.name}</span> (
            <span>{currentEnvironment?.name || 'Production'}</span>).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchData} loading={loading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>

          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-xs text-white bg-slate-900 hover:bg-black px-3.5 py-1.5 rounded-lg font-medium transition"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Docs</span>
            <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <Card className="hover:border-slate-300 transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Requests (7d)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
                {formatNumber(summary.totalRequests)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Total requests logged</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="hover:border-slate-300 transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Success Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
                {summary.totalRequests > 0 ? `${summary.successRate}%` : '—'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {summary.totalRequests > 0 ? `${summary.successfulRequests} successful` : 'No traffic recorded'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Latency */}
        <Card className="hover:border-slate-300 transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Avg Latency</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
                {summary.totalRequests > 0 ? formatLatency(summary.averageLatencyMs) : '—'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {summary.totalRequests > 0 ? `P95: ${formatLatency(summary.p95LatencyMs)}` : 'Roundtrip response'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Estimated Spend */}
        <Card className="hover:border-slate-300 transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Estimated Cost</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
                {formatCurrency(summary.totalCost)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {summary.totalTokens > 0 ? `${formatNumber(summary.totalTokens)} tokens` : 'Token spend'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Volume Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-semibold">Request Volume Trend</CardTitle>
              <CardDescription>Daily execution volume over the past 7 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            {analytics?.timeSeries && analytics.timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeSeries}>
                  <defs>
                    <linearGradient id="reqGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#0F172A' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    name="Requests"
                    stroke="#0284C7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#reqGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Inbox className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-medium text-slate-700">No request activity recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm text-center">
                  Requests sent to <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">POST /v1/chat/completions</code> will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Provider Breakdown Donut */}
        <Card>
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold">Traffic by Provider</CardTitle>
            <CardDescription>Share of gateway volume per provider</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center">
            {analytics?.byProvider && analytics.byProvider.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.byProvider}
                    dataKey="count"
                    nameKey="provider"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={4}
                  >
                    {analytics.byProvider.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#0F172A' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500">
                <Cpu className="w-8 h-8 mb-2 mx-auto opacity-40" />
                <p className="text-xs font-medium text-slate-700">No provider distribution yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {connectedProviders.length} connected provider(s) configured.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connected Providers Strip */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">Connected Providers</CardTitle>
              <Badge variant="cyan" className="font-mono text-[10px]">
                {connectedProviders.length}
              </Badge>
            </div>
            <CardDescription>
              Configured upstream providers
            </CardDescription>
          </div>
          <Link
            href="/providers"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Manage Providers <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {connectedProviders.length === 0 ? (
            <div className="py-6 px-4 rounded-xl border border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
              <p className="text-xs text-slate-600">
                No active provider connections linked yet.
              </p>
              <Link
                href="/providers"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Connect OpenAI, Anthropic, Google Gemini, Groq, or custom providers &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {connectedProviders.slice(0, 8).map((conn) => {
                const isOnline = conn.status === 'connected';
                return (
                  <Link
                    key={conn.id}
                    href="/providers"
                    className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center font-bold uppercase text-[10px] text-blue-700 shrink-0">
                        {conn.provider.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 capitalize truncate group-hover:text-blue-600 transition">
                          {conn.customName || conn.provider}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          {conn.apiKeyPreview || '••••••••'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOnline ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
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
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <div>
            <CardTitle className="text-sm font-semibold">Recent Requests</CardTitle>
            <CardDescription>Live incoming traffic through the gateway</CardDescription>
          </div>
          <Link
            href="/requests"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            All Requests <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <EmptyState
              title="No requests recorded yet"
              description="Make a request to POST /v1/chat/completions using your Tanvelo API key to see live telemetry appear here."
              actionLabel="View Documentation"
              onAction={() => {
                window.location.href = '/docs';
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono bg-slate-50/50">
                    <th className="py-2.5 px-3 font-medium">Request ID</th>
                    <th className="py-2.5 px-3 font-medium">Provider & Model</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium">Latency</th>
                    <th className="py-2.5 px-3 font-medium">Tokens</th>
                    <th className="py-2.5 px-3 font-medium">Cost</th>
                    <th className="py-2.5 px-3 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-medium">
                        <Link href={`/requests/${req.requestId}`} className="hover:text-blue-600 hover:underline">
                          {req.requestId.slice(0, 18)}...
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        <span className="font-semibold capitalize text-slate-900">{req.provider}</span>
                        {req.model && <span className="text-slate-500 ml-1.5 font-mono text-[11px]">({req.model})</span>}
                      </td>
                      <td className="py-2.5 px-3">
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
                      <td className="py-2.5 px-3 text-slate-800 font-mono">{formatLatency(req.totalLatencyMs)}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-mono">{formatNumber(req.totalTokens)}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-mono">{formatCurrency(req.estimatedCost)}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-right">
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
