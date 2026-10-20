'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, Info } from 'lucide-react';
import { parseApiResponse } from '@/lib/utils';

interface RateLimitPolicy {
  id: string;
  projectId: string;
  environmentId?: string | null;
  keyId?: string | null;
  requestsPerMinute?: number | null;
  requestsPerHour?: number | null;
  requestsPerDay?: number | null;
  tokensPerMinute?: number | null;
  createdAt: string;
  environment?: { name: string };
}

export default function RateLimitsPage() {
  const { currentProject, currentEnvironment } = useProject();
  const [policies, setPolicies] = useState<RateLimitPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isOpen, setIsOpen] = useState(false);
  const [rpm, setRpm] = useState('60');
  const [tpm, setTpm] = useState('100000');
  const [rph, setRph] = useState('1000');
  const [rpd, setRpd] = useState('10000');
  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = async () => {
    if (!currentProject) return;
    try {
      const res = await fetch(`/api/rate-limits?projectId=${currentProject.id}`);
      if (res.ok) {
        setPolicies(await parseApiResponse(res));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [currentProject, currentEnvironment]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/rate-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          environmentId: currentEnvironment?.id || null,
          requestsPerMinute: rpm ? parseInt(rpm) : null,
          tokensPerMinute: tpm ? parseInt(tpm) : null,
          requestsPerHour: rph ? parseInt(rph) : null,
          requestsPerDay: rpd ? parseInt(rpd) : null,
        }),
      });

      await parseApiResponse(res);
      setIsOpen(false);
      await fetchPolicies();
    } catch (e: any) {
      alert(e.message || 'Failed to create rate limit policy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate limit policy?')) return;
    try {
      const res = await fetch(`/api/rate-limits/${id}`, { method: 'DELETE' });
      await parseApiResponse(res);
      await fetchPolicies();
    } catch (e: any) {
      alert(e.message || 'Failed to delete policy');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Rate Limiting & Token Throttling</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure fixed-window request and token counters enforced by Redis across gateway nodes (with in-memory local fallback).
          </p>
        </div>

        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Policy
        </Button>
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 flex items-start gap-3 text-xs text-slate-700 shadow-2xs">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-900">Fixed-Window Counter Semantics:</span>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Tanvelo enforces rate limits via distributed atomic fixed-window counters. When request or token limits are reached, the gateway responds with HTTP 429 and standard headers (<code className="text-sky-700 font-mono bg-white px-1 py-0.5 rounded border border-sky-200">X-RateLimit-Limit</code>, <code className="text-sky-700 font-mono bg-white px-1 py-0.5 rounded border border-sky-200">X-RateLimit-Remaining</code>, <code className="text-sky-700 font-mono bg-white px-1 py-0.5 rounded border border-sky-200">X-RateLimit-Reset</code> in seconds remaining, and <code className="text-sky-700 font-mono bg-white px-1 py-0.5 rounded border border-sky-200">Retry-After</code>). Policy precedence is strictly key-specific &gt; environment &gt; project-wide.
          </p>
        </div>
      </div>

      {/* Policies List Card */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Active Rate Limit Policies</CardTitle>
          <CardDescription>Policies applied to incoming Bearer token requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading rate limit policies...</div>
          ) : policies.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No custom rate limits configured. Default project limit (1,000 req/min) applies.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono bg-slate-50/50">
                    <th className="py-2.5 px-3 font-medium">Policy ID</th>
                    <th className="py-2.5 px-3 font-medium">Scope</th>
                    <th className="py-2.5 px-3 font-medium">Req / Min</th>
                    <th className="py-2.5 px-3 font-medium">Tokens / Min</th>
                    <th className="py-2.5 px-3 font-medium">Req / Hour</th>
                    <th className="py-2.5 px-3 font-medium">Req / Day</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono text-slate-700">{p.id.slice(0, 14)}...</td>
                      <td className="py-3 px-3 text-slate-800">
                        {p.keyId ? (
                          <Badge variant="purple" className="font-mono text-[10px]">Key Specific</Badge>
                        ) : p.environment?.name ? (
                          <Badge variant="cyan" className="font-mono text-[10px]">{p.environment.name}</Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-[10px]">Project-Wide</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-sky-700 font-medium">
                        {p.requestsPerMinute ? `${p.requestsPerMinute} req/m` : 'Unlimited'}
                      </td>
                      <td className="py-3 px-3 font-mono text-indigo-700 font-medium">
                        {p.tokensPerMinute ? `${p.tokensPerMinute.toLocaleString()} tok/m` : 'Unlimited'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {p.requestsPerHour ? `${p.requestsPerHour.toLocaleString()} req/h` : 'Unlimited'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {p.requestsPerDay ? `${p.requestsPerDay.toLocaleString()} req/d` : 'Unlimited'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Policy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Rate Limit Policy"
        description="Configure atomic sliding window or fixed limit per key, environment, or project."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Requests Per Minute (RPM)
            </label>
            <input
              type="number"
              placeholder="e.g. 60"
              value={rpm}
              onChange={(e) => setRpm(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tokens Per Minute (TPM)
            </label>
            <input
              type="number"
              placeholder="e.g. 100000 (tokens/minute)"
              value={tpm}
              onChange={(e) => setTpm(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono shadow-2xs"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Limits the combined prompt and completion token throughput per rolling 60 seconds.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Requests Per Hour</label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={rph}
              onChange={(e) => setRph(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Requests Per Day</label>
            <input
              type="number"
              placeholder="e.g. 10000"
              value={rpd}
              onChange={(e) => setRpd(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Save Policy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
