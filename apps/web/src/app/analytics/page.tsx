'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatLatency, formatNumber } from '@/lib/utils';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  DollarSign,
  Inbox,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AnalyticsPage() {
  const { currentProject, currentEnvironment } = useProject();
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState('7');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!currentProject) return;
    setLoading(true);

    try {
      const envParam = currentEnvironment ? `&environmentId=${currentEnvironment.id}` : '';
      const res = await fetch(`/api/analytics?projectId=${currentProject.id}${envParam}&days=${days}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentProject, currentEnvironment, days]);

  const exportCSV = () => {
    if (!data?.timeSeries || data.timeSeries.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = ['Date', 'Total Requests', 'Successful Requests', 'Failed Requests', 'Estimated Cost (USD)'];
    const rows = data.timeSeries.map((t: any) => [
      t.date,
      t.requests,
      t.success,
      t.error,
      t.cost.toFixed(6),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tanvelo-analytics-${currentProject?.slug || 'project'}-${days}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data?.summary || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    successRate: 0,
    errorRate: 0,
    averageLatencyMs: 0,
    p95LatencyMs: 0,
    totalTokens: 0,
    totalCost: 0,
  };

  const COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Date Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Persisted metrics computed from recorded gateway requests and token usage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Days selector */}
          <div className="flex items-center bg-white border border-slate-200 shadow-sm rounded-lg p-1 text-xs">
            <button
              onClick={() => setDays('1')}
              className={`px-3 py-1 rounded-md transition ${
                days === '1' ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              24h
            </button>
            <button
              onClick={() => setDays('7')}
              className={`px-3 py-1 rounded-md transition ${
                days === '7' ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7d
            </button>
            <button
              onClick={() => setDays('30')}
              className={`px-3 py-1 rounded-md transition ${
                days === '30' ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30d
            </button>
          </div>

          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-slate-500 block font-medium">Total Volume</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(summary.totalRequests)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {summary.successfulRequests} success • {summary.failedRequests} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-slate-500 block font-medium">Latency (Avg / P95)</span>
            <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
              {summary.totalRequests > 0 ? `${formatLatency(summary.averageLatencyMs)} / ${formatLatency(summary.p95LatencyMs)}` : '—'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Measured provider roundtrips</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-slate-500 block font-medium">Total Tokens</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {formatNumber(summary.totalTokens)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Input & output tokens combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-slate-500 block font-medium">Estimated Cost</span>
            <div className="text-2xl font-bold text-purple-700 mt-1 font-mono">
              {formatCurrency(summary.totalCost)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Not an invoice; estimate only</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Request Volume (Success vs Failed)</CardTitle>
            <CardDescription>Daily execution trend over the selected period</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {data?.timeSeries && data.timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.timeSeries}>
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="success" name="Successful" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="error" name="Failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Inbox className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No analytics data recorded for this timeframe.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Accumulation */}
        <Card>
          <CardHeader>
            <CardTitle>Estimated Cost Over Time</CardTitle>
            <CardDescription>Cumulative token cost in USD</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {data?.timeSeries && data.timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    name="Cost ($)"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#costGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Inbox className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No cost data recorded for this timeframe.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Requests by Model</CardTitle>
            <CardDescription>Model consumption patterns</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {data?.byModel && data.byModel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byModel} layout="vertical">
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="model"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" name="Requests" fill="#0284C7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Inbox className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No model usage recorded.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
