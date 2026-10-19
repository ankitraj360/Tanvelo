'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Webhook, Plus, Play, Trash2, ShieldCheck, History, CheckCircle2, AlertCircle } from 'lucide-react';

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  isEnabled: boolean;
  createdAt: string;
  deliveryCount: number;
}

const AVAILABLE_EVENTS = [
  { id: 'request.failed', label: 'Request Failed', desc: 'Triggered when an upstream call exhausts retries and fails' },
  { id: 'provider.unavailable', label: 'Provider Unavailable', desc: 'Triggered when a provider connection is rejected or down' },
  { id: 'rate_limit.exceeded', label: 'Rate Limit Exceeded', desc: 'Triggered when a client crosses a gateway rate limit' },
  { id: 'budget.warning', label: 'Budget Warning Threshold', desc: 'Triggered when project spend crosses the warning threshold' },
  { id: 'budget.exceeded', label: 'Budget Exceeded', desc: 'Triggered when spending reaches the maximum budget limit' },
];

export default function WebhooksPage() {
  const { currentProject } = useProject();
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['request.failed']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show secret modal
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // Test ping & deliveries
  const [testResult, setTestResult] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [inspectingWebhookId, setInspectingWebhookId] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    if (!currentProject) return;
    try {
      const res = await fetch(`/api/webhooks?projectId=${currentProject.id}`);
      if (res.ok) {
        setWebhooks(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [currentProject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !url.trim() || selectedEvents.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          url: url.trim(),
          events: selectedEvents,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create webhook');
      }

      const data = await res.json();
      setIsAddOpen(false);
      setUrl('');
      setCreatedSecret(data.secret);
      await fetchWebhooks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook endpoint?')) return;
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchWebhooks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestPing = async (id: string) => {
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
      await fetchWebhooks();
    } catch (e: any) {
      setTestResult({ isSuccess: false, errorMessage: e.message });
    }
  };

  const viewDeliveries = async (id: string) => {
    setInspectingWebhookId(id);
    try {
      const res = await fetch(`/api/webhooks/${id}/deliveries`);
      if (res.ok) {
        setDeliveries(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Webhooks</h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch signed HMAC HTTP POST notifications upon failure events, rate-limits, or budget alerts.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Webhook
        </Button>
      </div>

      {/* Test Ping Status Box */}
      {testResult && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            testResult.isSuccess
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>
              {testResult.isSuccess
                ? `Test ping delivered successfully! HTTP ${testResult.statusCode}`
                : `Test ping failed: ${testResult.errorMessage}`}
            </span>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-[11px] underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Webhook Endpoints</CardTitle>
          <CardDescription>
            All delivery payloads are signed with HMAC-SHA256 headers (<code className="text-cyan-400 font-mono">X-Tanvelo-Signature</code>)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No webhook destinations registered. Add a webhook URL to receive real-time incident notifications.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Destination URL</th>
                    <th className="pb-3 font-medium">Subscribed Events</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Deliveries</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {webhooks.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 font-mono text-slate-200">{w.url}</td>
                      <td className="py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {w.events.map((ev) => (
                            <span
                              key={ev}
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-cyan-400 font-mono"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="py-3.5 font-mono text-slate-300">
                        <button
                          onClick={() => viewDeliveries(w.id)}
                          className="hover:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <History className="w-3.5 h-3.5" /> {w.deliveryCount} attempts
                        </button>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleTestPing(w.id)}
                          >
                            <Play className="w-3 h-3 mr-1 text-emerald-400" /> Ping
                          </Button>
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40 transition"
                            title="Delete Webhook"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Webhook Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Webhook Endpoint"
        description="Tanvelo verifies destination IPs against private/loopback SSRF restrictions."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Payload URL</label>
            <input
              type="url"
              required
              placeholder="https://your-api.com/webhooks/tanvelo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Destination must be public HTTP or HTTPS. Loopback/internal IPs (127.0.0.1, RFC1918, metadata) are blocked.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Subscribe to Events</label>
            <div className="space-y-2">
              {AVAILABLE_EVENTS.map((ev) => {
                const checked = selectedEvents.includes(ev.id);
                return (
                  <div
                    key={ev.id}
                    onClick={() => toggleEvent(ev.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 transition ${
                      checked
                        ? 'bg-blue-950/20 border-blue-800/80 text-slate-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-blue-600 focus:ring-0 bg-slate-800 border-slate-700"
                    />
                    <div>
                      <span className="font-semibold block text-slate-200 font-mono">{ev.id}</span>
                      <p className="text-[11px] text-slate-400">{ev.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Register Webhook
            </Button>
          </div>
        </form>
      </Modal>

      {/* Show Secret Modal */}
      <Modal
        isOpen={Boolean(createdSecret)}
        onClose={() => setCreatedSecret(null)}
        title="Webhook Signing Secret"
        description="Verify signatures using this secret to authenticate requests originating from Tanvelo."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Tanvelo includes the signature in the <code className="text-cyan-400 font-mono">X-Tanvelo-Signature</code> header.
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-emerald-400 text-xs select-all">
            {createdSecret}
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreatedSecret(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deliveries History Modal */}
      <Modal
        isOpen={Boolean(inspectingWebhookId)}
        onClose={() => setInspectingWebhookId(null)}
        title="Delivery Attempts Log"
        description="Historical log of outgoing HTTP webhook deliveries."
        maxWidth="lg"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {deliveries.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No delivery attempts recorded yet.</p>
          ) : (
            deliveries.map((d) => (
              <div key={d.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={d.isSuccess ? 'success' : 'destructive'}>
                      {d.statusCode ? `HTTP ${d.statusCode}` : 'Network Failure'}
                    </Badge>
                    <span className="font-mono text-slate-300">{d.eventType}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{new Date(d.createdAt).toLocaleTimeString()}</span>
                </div>
                {d.errorMessage && <p className="text-rose-400 text-[11px] font-mono">{d.errorMessage}</p>}
                {d.responseBody && (
                  <p className="text-slate-400 text-[10px] font-mono truncate">{d.responseBody}</p>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
