'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { KeyRound, Plus, Copy, Check, RotateCw, Trash2, ShieldAlert, AlertTriangle } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  projectId: string;
  projectName: string;
  environmentId: string;
  environmentName: string;
  status: 'active' | 'revoked';
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { currentProject, currentEnvironment } = useProject();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedEnvId, setSelectedEnvId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Key Generated Modal
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    if (!currentProject) return;
    try {
      const res = await fetch(`/api/api-keys?projectId=${currentProject.id}`);
      if (res.ok) {
        setKeys(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    if (currentEnvironment) setSelectedEnvId(currentEnvironment.id);
  }, [currentProject, currentEnvironment]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !selectedEnvId || !keyName.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          environmentId: selectedEnvId,
          name: keyName.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsCreateOpen(false);
        setKeyName('');
        setGeneratedKey(data.rawKey);
        await fetchKeys();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Requests using it will be rejected immediately.')) {
      return;
    }
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchKeys();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRotate = async (id: string) => {
    if (!confirm('Rotating will revoke the current key and issue a new replacement token. Continue?')) {
      return;
    }
    try {
      const res = await fetch(`/api/api-keys/${id}/rotate`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setGeneratedKey(data.rawKey);
        await fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Gateway API Keys</h1>
          <p className="text-xs text-slate-400 mt-1">
            Keys used by client applications to authenticate with Tanvelo endpoint <code className="text-blue-400 font-mono">POST /v1/chat/completions</code>.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Create API Key
        </Button>
      </div>

      {/* Keys Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Active & Revoked API Keys</CardTitle>
          <CardDescription>
            Only SHA-256 hashes are persisted in the database; raw keys are shown strictly once upon generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No API keys generated yet. Click &quot;Create API Key&quot; to authorize gateway requests.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Key Prefix</th>
                    <th className="pb-3 font-medium">Environment</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Last Used</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 font-semibold text-slate-200">{k.name}</td>
                      <td className="py-3.5 font-mono text-cyan-400">{k.keyPrefix}</td>
                      <td className="py-3.5">
                        <Badge variant="outline">{k.environmentName}</Badge>
                      </td>
                      <td className="py-3.5">
                        <Badge variant={k.status === 'active' ? 'success' : 'destructive'}>
                          {k.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-3.5 text-right">
                        {k.status === 'active' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRotate(k.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
                              title="Rotate Key"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRevoke(k.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40 transition"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Revoked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Gateway API Key"
        description="Keys are cryptographically secure random tokens used in client Authorization headers."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Key Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Backend Production Server"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Environment</label>
            <select
              value={selectedEnvId}
              onChange={(e) => setSelectedEnvId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none"
            >
              {currentProject?.environments?.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name} ({env.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Generate Key
            </Button>
          </div>
        </form>
      </Modal>

      {/* Show Generated Key Modal */}
      <Modal
        isOpen={Boolean(generatedKey)}
        onClose={() => setGeneratedKey(null)}
        title="Save Your Tanvelo API Key"
        description="Please copy this key now. For security purposes, it will never be displayed again."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <p>
              Store this token safely in your environment variables. It cannot be recovered once this modal is closed.
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              readOnly
              value={generatedKey || ''}
              className="w-full pl-3 pr-20 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 select-all"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={copyKey}
              className="absolute right-1 top-1 h-7 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                </>
              )}
            </Button>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setGeneratedKey(null)}>
              I Have Saved My Key
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
