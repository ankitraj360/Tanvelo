'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { GitFork, Plus, Trash2 } from 'lucide-react';
import { parseApiResponse } from '@/lib/utils';

interface RoutingRule {
  id: string;
  projectId: string;
  environmentId: string;
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
}

export default function RoutingPage() {
  const { currentProject, currentEnvironment } = useProject();
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [pattern, setPattern] = useState('*');
  const [primaryProvider, setPrimaryProvider] = useState('openai');
  const [primaryModel, setPrimaryModel] = useState('gpt-4o');
  const [secondaryProvider, setSecondaryProvider] = useState('anthropic');
  const [secondaryModel, setSecondaryModel] = useState('claude-3-5-sonnet-20241022');
  const [timeoutMs, setTimeoutMs] = useState('20000');
  const [maxRetries, setMaxRetries] = useState('2');
  const [submitting, setSubmitting] = useState(false);

  const fetchRules = async () => {
    if (!currentProject || !currentEnvironment) return;
    try {
      const res = await fetch(`/api/routing?projectId=${currentProject.id}&environmentId=${currentEnvironment.id}`);
      if (res.ok) {
        setRules(await parseApiResponse(res));
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
          modelPattern: pattern.trim(),
          primaryProvider,
          primaryModel: primaryModel.trim(),
          secondaryProvider: secondaryProvider ? secondaryProvider : null,
          secondaryModel: secondaryModel.trim() ? secondaryModel.trim() : null,
          timeoutMs: parseInt(timeoutMs) || 20000,
          maxRetries: parseInt(maxRetries) || 2,
          fallbackOnTimeout: true,
          fallbackOnRateLimit: true,
          fallbackOnError: true,
        }),
      });

      await parseApiResponse(res);
      setIsOpen(false);
      await fetchRules();
    } catch (e: any) {
      alert(e.message || 'Failed to create routing rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this routing rule?')) return;
    try {
      const res = await fetch(`/api/routing/${id}`, { method: 'DELETE' });
      await parseApiResponse(res);
      await fetchRules();
    } catch (e: any) {
      alert(e.message || 'Failed to delete rule');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Routing & Fallbacks</h1>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic rules routing requests to preferred models with automatic failover on outages or rate limits.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New Rule
        </Button>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader className="border-b border-slate-100">
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
                  <tr className="border-b border-slate-200 text-slate-500 font-mono bg-slate-50/50">
                    <th className="py-2.5 px-3 font-medium">Model Pattern</th>
                    <th className="py-2.5 px-3 font-medium">Primary Target</th>
                    <th className="py-2.5 px-3 font-medium">Secondary Fallback</th>
                    <th className="py-2.5 px-3 font-medium">Failover Triggers</th>
                    <th className="py-2.5 px-3 font-medium">Timeout / Retries</th>
                    <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono text-sky-700 font-semibold">
                        {rule.modelPattern}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 capitalize">
                          {rule.primaryProvider}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">{rule.primaryModel}</div>
                      </td>
                      <td className="py-3 px-3">
                        {rule.secondaryProvider ? (
                          <>
                            <div className="font-semibold text-slate-900 capitalize">
                              {rule.secondaryProvider}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {rule.secondaryModel}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400 font-mono">None</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {rule.fallbackOnTimeout && <Badge variant="outline">Timeout</Badge>}
                          {rule.fallbackOnRateLimit && <Badge variant="warning">429 RateLimit</Badge>}
                          {rule.fallbackOnError && <Badge variant="destructive">5xx Outage</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {rule.timeoutMs / 1000}s • max {rule.maxRetries} retries
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition"
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
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Model Pattern (e.g. *, gpt-*, claude-*)
            </label>
            <input
              type="text"
              required
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Primary Provider</label>
              <select
                value={primaryProvider}
                onChange={(e) => setPrimaryProvider(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
                <option value="deepseek">DeepSeek</option>
                <option value="groq">Groq</option>
                <option value="mistral">Mistral AI</option>
                <option value="ollama">Ollama</option>
                <option value="openrouter">OpenRouter</option>
                <option value="cohere">Cohere</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Primary Model</label>
              <input
                type="text"
                required
                value={primaryModel}
                onChange={(e) => setPrimaryModel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Secondary Provider (Fallback)
              </label>
              <select
                value={secondaryProvider}
                onChange={(e) => setSecondaryProvider(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="deepseek">DeepSeek</option>
                <option value="groq">Groq</option>
                <option value="mistral">Mistral AI</option>
                <option value="ollama">Ollama</option>
                <option value="openrouter">OpenRouter</option>
                <option value="cohere">Cohere</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Secondary Model</label>
              <input
                type="text"
                value={secondaryModel}
                onChange={(e) => setSecondaryModel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Timeout (ms)</label>
              <input
                type="number"
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Max Retries</label>
              <input
                type="number"
                min="1"
                max="5"
                value={maxRetries}
                onChange={(e) => setMaxRetries(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
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
