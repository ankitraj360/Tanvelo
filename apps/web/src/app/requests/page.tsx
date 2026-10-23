'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatLatency, formatNumber } from '@/lib/utils';
import { Activity, Search, Filter, ArrowRight, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function RequestsPage() {
  const { currentProject, currentEnvironment } = useProject();
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');

  const fetchRequests = async () => {
    if (!currentProject) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        projectId: currentProject.id,
        page: page.toString(),
        limit: '15',
      });
      if (currentEnvironment) params.append('environmentId', currentEnvironment.id);
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (providerFilter) params.append('provider', providerFilter);

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentProject, currentEnvironment, page, statusFilter, providerFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">API Requests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real request logs captured through Tanvelo LLM Gateway endpoint.
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={fetchRequests} loading={loading}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Request ID or model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="success">Success (200)</option>
              <option value="error">Error</option>
              <option value="rate_limited">Rate Limited (429)</option>
              <option value="budget_exceeded">Budget Exceeded</option>
            </select>

            {/* Provider Filter */}
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">All Providers</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table Card */}
      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No requests have been recorded yet"
                description="Gateway requests appear here in real time when client applications call POST /v1/chat/completions."
                actionLabel="View Quickstart Code"
                onAction={() => {
                  window.location.href = '/docs';
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                    <th className="py-3 px-6 font-medium">Request ID</th>
                    <th className="py-3 px-4 font-medium">Timestamp</th>
                    <th className="py-3 px-4 font-medium">Provider / Model</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Total Latency</th>
                    <th className="py-3 px-4 font-medium">Tokens</th>
                    <th className="py-3 px-4 font-medium">Est. Cost</th>
                    <th className="py-3 px-6 font-medium text-right">Inspector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-6 font-mono text-slate-800">
                        <Link href={`/requests/${r.requestId}`} className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                          {r.requestId}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-semibold text-slate-800">{r.provider}</span>
                        {r.model && <span className="block text-[11px] font-mono text-slate-500">{r.model}</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            r.status === 'success'
                              ? 'success'
                              : r.status === 'rate_limited'
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {r.statusCode} {r.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {formatLatency(r.totalLatencyMs)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {formatNumber(r.totalTokens)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {formatCurrency(r.estimatedCost)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          href={`/requests/${r.requestId}`}
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Inspect <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing page <span className="text-slate-800 font-semibold">{page}</span> of{' '}
                <span className="text-slate-800 font-semibold">{totalPages}</span> ({total} requests)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
