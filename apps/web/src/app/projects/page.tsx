'use client';

import React, { useState } from 'react';
import { useProject, Project } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { FolderGit2, Plus, ArrowRight, Trash2, Edit3, Check } from 'lucide-react';
import Link from 'next/link';
import { parseApiResponse } from '@/lib/utils';

export default function ProjectsPage() {
  const { projects, currentProject, setCurrentProject, refreshProjects } = useProject();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      await parseApiResponse(res);
      await refreshProjects();
      setIsCreateOpen(false);
      setName('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      await parseApiResponse(res);
      await refreshProjects();
      setIsEditOpen(false);
      setEditingProject(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (proj: Project) => {
    if (!confirm(`Are you sure you want to delete "${proj.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${proj.id}`, { method: 'DELETE' });
      await parseApiResponse(res);
      await refreshProjects();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage projects, multi-tenant environment isolation, and associated gateway configurations
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          const isSelected = currentProject?.id === proj.id;

          return (
            <Card
              key={proj.id}
              className={`flex flex-col justify-between transition-all ${
                isSelected ? 'border-sky-500 bg-sky-50/20 shadow-xs' : 'hover:border-slate-300'
              }`}
            >
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-sky-100 text-sky-700 border border-sky-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-900">{proj.name}</CardTitle>
                      <p className="text-[11px] text-slate-500 font-mono">slug: {proj.slug}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <Badge variant="cyan" className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </Badge>
                  )}
                </div>

                {proj.description && (
                  <CardDescription className="line-clamp-2 mt-2 text-slate-600">{proj.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="py-2">
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Envs</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {proj.environments?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">API Keys</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {proj._count?.apiKeys || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Requests</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {proj._count?.gatewayRequests || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {proj.environments?.map((env) => (
                    <span
                      key={env.id}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-700"
                    >
                      {env.name}
                    </span>
                  ))}
                </div>
              </CardContent>

              <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/60 rounded-b-xl">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingProject(proj);
                      setName(proj.name);
                      setDescription(proj.description || '');
                      setIsEditOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200/60 transition"
                    title="Edit Project"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {projects.length > 1 && (
                    <button
                      onClick={() => handleDelete(proj)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isSelected && (
                    <Button size="sm" variant="outline" onClick={() => setCurrentProject(proj)}>
                      Select
                    </Button>
                  )}
                  <Link
                    href={`/projects/${proj.id}`}
                    className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
                  >
                    Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Project"
        description="Projects isolate API keys, provider credentials, routing rules, and analytics."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Project Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Production Mobile App"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Brief description of this project and workloads"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800 block">Default Setup:</span>
            <p>• Automatically creates Production, Staging, and Development environments.</p>
            <p>• Configures default OpenAI, Anthropic, and Gemini model pricing definitions.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Project"
        description="Update project name and description."
      >
        <form onSubmit={handleEdit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
