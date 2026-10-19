'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatLatency } from '@/lib/utils';
import { AlertTriangle, ShieldAlert, Clock, RefreshCw, ArrowRight, Ban, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ErrorsPage() {
  const { currentProject, currentEnvironment } = useProject();
  const [data, setData] = useState<{ breakdown: any[]; errors: any[] }>({ breakdown: [], errors: [] });
  const [loading, setLoading] = useState(true);

  const fetchErrors = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const envParam = currentEnvironment ? `&environmentId=${currentEnvironment.id}` : '';
      const res = await fetch(`/api/errors?projectId=${currentProject.id}${envParam}`);
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
    fetchErrors();
  }, [currentProject, currentEnvironment]);

  const totalErrors = data.breakdown.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Errors & Failures</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real error categorizations, upstream outages, quota limits, and failure events.
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={fetchErrors} loading={loading}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Error Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-400 block font-medium">Total Failure Events</span>
            <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">{totalErrors}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Across all categories</p>
          </CardContent>
        </Card>

        {data.breakdown.slice(0, 3).map((item) => (
          <Card key={item.category}>
            <CardContent className="p-4">
              <span className="text-[11px] text-slate-400 block font-medium truncate capitalize">
                {item.category.replace(/_/g, ' ')}
              </span>
              <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">{item.count}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Categorized occurrences</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Errors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Error Logs</CardTitle>
          <CardDescription>
            Categorized failures from gateway rejections, provider rate-limits, or upstream timeouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.errors.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No errors have been recorded yet"
              description="No failures, rate limit exceedances, or provider outages have occurred for this project."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Request ID</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Error Message</th>
                    <th className="pb-3 font-medium">Provider / Model</th>
                    <th className="pb-3 font-medium">Status Code</th>
                    <th className="pb-3 font-medium">Latency</th>
                    <th className="pb-3 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.errors.map((err) => (
                    <tr key={err.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 font-mono text-slate-200">
                        <Link href={`/requests/${err.requestId}`} className="hover:text-blue-400 hover:underline">
                          {err.requestId.slice(0, 16)}...
                        </Link>
                      </td>
                      <td className="py-3">
                        <Badge variant="destructive">{err.errorCategory || 'uncategorized'}</Badge>
                      </td>
                      <td className="py-3 text-rose-300 font-mono text-[11px] max-w-xs truncate">
                        {err.errorMessage || 'Unknown error'}
                      </td>
                      <td className="py-3 text-slate-300 capitalize">
                        {err.provider}{' '}
                        <span className="text-slate-500 font-mono text-[11px]">({err.model})</span>
                      </td>
                      <td className="py-3 font-mono text-slate-300">{err.statusCode}</td>
                      <td className="py-3 font-mono text-slate-300">{formatLatency(err.totalLatencyMs)}</td>
                      <td className="py-3 text-slate-500 text-right">
                        {new Date(err.createdAt).toLocaleTimeString()}
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
