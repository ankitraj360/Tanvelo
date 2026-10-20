'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { KeyRound, Plus, Copy, Check, RotateCw, Trash2, AlertTriangle } from 'lucide-react';
import { parseApiResponse } from '@/lib/utils';

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
        setKeys(await parseApiResponse(res));
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

      const data = await parseApiResponse(res);
      setIsCreateOpen(false);
      setKeyName('');
      setGeneratedKey(data.rawKey);
      await fetchKeys();
    } catch (e: any) {
      alert(e.message || 'Failed to create key');
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
      await parseApiResponse(res);
      await fetchKeys();
    } catch (e: any) {
      alert(`Revoke error: ${e.message}`);
    }
  };

  const handleRotate = async (id: string) => {
    if (!confirm('Rotating will revoke the current key and issue a new replacement token. Continue?')) {
      return;
    }
    try {
      const res = await fetch(`/api/api-keys/${id}/rotate`, { method: 'POST' });
      const data = await parseApiResponse(res);
      setGeneratedKey(data.rawKey);
      await fetchKeys();
    } catch (e: any) {
      alert(`Rotate error: ${e.message}`);
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gateway API Keys</h1>
          <p className="text-xs text-slate-500 mt-1">
            Keys used by client applications to authenticate with Tanvelo endpoint <code className="text-sky-700 bg-sky-50 px-1 py-0.5 rounded font-mono">POST /v1/chat/completions</code>.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Create API Key
        </Button>
      </div>

      {/* Keys Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100">
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
                  <tr className="border-b border-slate-200 text-slate-500 font-mono bg-slate-50/50">
                    <th className="py-2.5 px-3 font-medium">Name</th>
                    <th className="py-2.5 px-3 font-medium">Key Prefix</th>
                    <th className="py-2.5 px-3 font-medium">Environment</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium">Created</th>
                    <th className="py-2.5 px-3 font-medium">Last Used</th>
                    <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-semibold text-slate-900">{k.name}</td>
                      <td className="py-3 px-3 font-mono text-sky-700 font-medium">{k.keyPrefix}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline">{k.environmentName}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={k.status === 'active' ? 'success' : 'destructive'}>
                          {k.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {k.status === 'active' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRotate(k.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition"
                              title="Rotate Key"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRevoke(k.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Revoked</span>
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Key Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Backend Production Server"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Environment</label>
            <select
              value={selectedEnvId}
              onChange={(e) => setSelectedEnvId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs cursor-pointer"
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
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <p>
              Store this token safely in your environment variables. It cannot be recovered once this modal is closed.
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              readOnly
              value={generatedKey || ''}
              className="w-full pl-3 pr-20 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 select-all font-semibold shadow-inner"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={copyKey}
              className="absolute right-1 top-1 h-7 text-xs bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
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
