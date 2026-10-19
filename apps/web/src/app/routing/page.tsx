'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { GitFork, Plus, ArrowRight, Trash2, Info, Clock, RotateCcw } from 'lucide-react';

interface RoutingRule {
  id: string;
  modelPattern: string;
  primaryProvider: string;
  primaryModel: string;
  secondaryProvider?: string | null;
  secondaryModel?: string | null;
  fallbackOnTimeout: boolean;
  fallbackOnRateLimit: boolean;
  fallbackOnError: boolean;
  timeoutMs: number;
  maxRetries: number;
  priority: number;
  environment?: { name: string };
}

export default function RoutingPage() {
  const { currentProject, currentEnvironment } = useProject();
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [pattern, setPattern] = useState('*');
  const [primaryProvider, setPrimaryProvider] = useState('openai');
  const [primaryModel, setPrimaryModel] = useState('gpt-4o');
  const [secondaryProvider, setSecondaryProvider] = useState('anthropic');
  const [secondaryModel, setSecondaryModel] = useState('claude-3-5-sonnet-20241022');
  const [timeoutMs, setTimeoutMs] = useState('30000');
  const [maxRetries, setMaxRetries] = useState('2');
  const [submitting, setSubmitting] = useState(false);

  const fetchRules = async () => {
    if (!currentProject) return;
    try {
      const envParam = currentEnvironment ? `&environmentId=${currentEnvironment.id}` : '';
      const res = await fetch(`/api/routing?projectId=${currentProject.id}${envParam}`);
      if (res.ok) {
        setRules(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [currentProject, currentEnvironment]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !currentEnvironment) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          environmentId: currentEnvironment.id,
          modelPattern: pattern,
          primaryProvider,
          primaryModel,
          secondaryProvider: secondaryProvider || null,
          secondaryModel: secondaryModel || null,
          timeoutMs: parseInt(timeoutMs) || 30000,
          maxRetries: parseInt(maxRetries) || 2,
          fallbackOnTimeout: true,
          fallbackOnRateLimit: true,
          fallbackOnError: true,
        }),
      });

      if (res.ok) {
        await fetchRules();
        setIsOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this routing rule?')) return;
    try {
      const res = await fetch(`/api/routing/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchRules();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Routing & Fallbacks</h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic rules routing requests to preferred models with automatic failover on outages or rate limits.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New Rule
        </Button>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Routing Sequences</CardTitle>
          <CardDescription>
            Rules are evaluated deterministically in descending priority order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No custom routing rules for this environment. Default model name matching applies.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Model Pattern</th>
                    <th className="pb-3 font-medium">Primary Target</th>
                    <th className="pb-3 font-medium">Secondary Fallback</th>
                    <th className="pb-3 font-medium">Failover Triggers</th>
                    <th className="pb-3 font-medium">Timeout / Retries</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 font-mono text-cyan-400 font-semibold">
                        {rule.modelPattern}
                      </td>
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-200 capitalize">
                          {rule.primaryProvider}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">{rule.primaryModel}</div>
                      </td>
                      <td className="py-3.5">
                        {rule.secondaryProvider ? (
                          <>
                            <div className="font-semibold text-slate-200 capitalize">
                              {rule.secondaryProvider}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {rule.secondaryModel}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-500 font-mono">None</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          {rule.fallbackOnTimeout && <Badge variant="outline">Timeout</Badge>}
                          {rule.fallbackOnRateLimit && <Badge variant="outline">429 RateLimit</Badge>}
                          {rule.fallbackOnError && <Badge variant="outline">5xx Outage</Badge>}
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-slate-300">
                        {rule.timeoutMs / 1000}s • max {rule.maxRetries} retries
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40 transition"
                          title="Delete Rule"
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
        title="Create Routing Rule"
        description="Route models matching a specific name or wildcard with automated failover."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Model Pattern (e.g. *, gpt-*, claude-*)
            </label>
            <input
              type="text"
              required
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Primary Provider</label>
              <select
                value={primaryProvider}
                onChange={(e) => setPrimaryProvider(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Primary Model</label>
              <input
                type="text"
                required
                value={primaryModel}
                onChange={(e) => setPrimaryModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Secondary Provider (Fallback)
              </label>
              <select
                value={secondaryProvider}
                onChange={(e) => setSecondaryProvider(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none"
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Secondary Model</label>
              <input
                type="text"
                value={secondaryModel}
                onChange={(e) => setSecondaryModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Timeout (ms)</label>
              <input
                type="number"
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Max Retries</label>
              <input
                type="number"
                min="1"
                max="5"
                value={maxRetries}
                onChange={(e) => setMaxRetries(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Create Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
