'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FolderGit2, Layers, Plus, ArrowLeft, Cpu, KeyRound, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAddEnvOpen, setIsAddEnvOpen] = useState(false);
  const [envName, setEnvName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        setProject(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleAddEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!envName.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/environments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: envName.trim() }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to add environment');
      }

      await fetchProject();
      setIsAddEnvOpen(false);
      setEnvName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500 text-xs py-8">Loading project details...</div>;
  }

  if (!project) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-slate-800 font-semibold">Project not found</h3>
        <Link href="/projects" className="text-xs text-blue-600 font-medium mt-2 inline-block hover:underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
              <Badge variant="cyan">Active</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Project ID: <span className="font-mono text-slate-800 font-medium">{project.id}</span> • Slug:{' '}
              <span className="font-mono text-slate-800 font-medium">{project.slug}</span>
            </p>
          </div>
        </div>

        <Button size="sm" onClick={() => setIsAddEnvOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Environment
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Workload Isolation</CardTitle>
            <CardDescription>Multi-tenant database segregation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
              <span className="text-slate-500">Created At</span>
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
              <span className="text-slate-500">Configured Models</span>
              <span>{project.modelConfigs?.length || 0} models</span>
            </div>
            <div className="flex justify-between py-1 text-slate-700">
              <span className="text-slate-500">Providers Assigned</span>
              <span>{project.providerConnections?.length || 0} providers</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Security Controls</CardTitle>
            <CardDescription>Encryption & Gateway Auth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-600 py-1 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>AES-256-GCM Key Encryption Active</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Upstream API keys are encrypted at rest with authenticated tags and never exposed to client browsers.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
            <CardDescription>Manage project gateway resources</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/api-keys"
              className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2 font-medium">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                Manage API Keys
              </span>
              <span>→</span>
            </Link>
            <Link
              href="/providers"
              className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2 font-medium">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Configure Providers
              </span>
              <span>→</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Environments List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Environments</CardTitle>
              <CardDescription>
                Environments provide independent API keys, rate limits, and routing rules
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {project.environments?.map((env: any) => (
              <div
                key={env.id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-900">{env.name}</span>
                    <Badge variant={env.slug === 'production' ? 'cyan' : 'outline'}>{env.slug}</Badge>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 mb-4">ID: {env.id}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Created {new Date(env.createdAt).toLocaleDateString()}</span>
                  <span className="text-emerald-600 font-medium">● Isolated</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Environment Modal */}
      <Modal
        isOpen={isAddEnvOpen}
        onClose={() => setIsAddEnvOpen(false)}
        title="Add Environment"
        description="Create an isolated environment (e.g. QA, Preview, Sandbox) for this project."
      >
        <form onSubmit={handleAddEnv} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Environment Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Staging-EU or Sandbox"
              value={envName}
              onChange={(e) => setEnvName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddEnvOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Add Environment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
