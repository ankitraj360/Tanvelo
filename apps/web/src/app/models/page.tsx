'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Edit3, Zap, Boxes, AlertCircle, RefreshCw, Plus, Trash2, Sparkles } from 'lucide-react';
import { formatNumber, parseApiResponse, extractErrorMessage } from '@/lib/utils';
import { useProject } from '@/context/ProjectContext';
import { PROVIDER_CATALOG } from '@/lib/providers';

interface Model {
  id: string;
  provider: string;
  modelId: string;
  name: string;
  contextWindow: number;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  supportsStreaming: boolean;
  isEnabled: boolean;
}

interface ProviderConn {
  id: string;
  provider: string;
  customName?: string | null;
  status: string;
}

export default function ModelsPage() {
  const { currentProject } = useProject();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Pricing Modal State
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [inputPrice, setInputPrice] = useState('');
  const [outputPrice, setOutputPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add Model Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProvider, setNewProvider] = useState('openrouter');
  const [newModelId, setNewModelId] = useState('');
  const [newName, setNewName] = useState('');
  const [newInputPrice, setNewInputPrice] = useState('0.00');
  const [newOutputPrice, setNewOutputPrice] = useState('0.00');
  const [newContextWindow, setNewContextWindow] = useState('128000');
  const [newSupportsStreaming, setNewSupportsStreaming] = useState(true);
  const [addingModel, setAddingModel] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchModels = async () => {
    if (!currentProject?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/models?projectId=${currentProject.id}`);
      setModels(await parseApiResponse(res));
    } catch (e: any) {
      console.error(e);
      setError(extractErrorMessage(e, 'Failed to load models'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [currentProject?.id]);

  const toggleModel = async (model: Model) => {
    try {
      const res = await fetch(`/api/models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !model.isEnabled }),
      });
      await parseApiResponse(res);
      await fetchModels();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/models/${editingModel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputPricePerMillion: parseFloat(inputPrice),
          outputPricePerMillion: parseFloat(outputPrice),
        }),
      });

      await parseApiResponse(res);
      setEditingModel(null);
      await fetchModels();
    } catch (e: any) {
      alert(e.message || 'Failed to update pricing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject?.id || !newModelId.trim()) return;

    setAddingModel(true);
    setAddError(null);

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          modelId: newModelId.trim(),
          name: newName.trim() || newModelId.trim(),
          provider: newProvider,
          inputPricePerMillion: parseFloat(newInputPrice) || 0,
          outputPricePerMillion: parseFloat(newOutputPrice) || 0,
          contextWindow: parseInt(newContextWindow, 10) || 128000,
          supportsStreaming: newSupportsStreaming,
          isEnabled: true,
        }),
      });

      await parseApiResponse(res);
      setIsAddModalOpen(false);
      // Reset form
      setNewModelId('');
      setNewName('');
      setNewInputPrice('0.00');
      setNewOutputPrice('0.00');
      setNewContextWindow('128000');
      setNewSupportsStreaming(true);
      await fetchModels();
    } catch (e: any) {
      setAddError(extractErrorMessage(e, 'Failed to add model'));
    } finally {
      setAddingModel(false);
    }
  };

  const handleDeleteModel = async (model: Model) => {
    if (!confirm(`Are you sure you want to remove "${model.name}" (${model.modelId})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/models/${model.id}`, {
        method: 'DELETE',
      });
      await parseApiResponse(res);
      await fetchModels();
    } catch (e: any) {
      alert(e.message || 'Failed to delete model');
    }
  };

  if (!currentProject) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Models &amp; Pricing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage supported LLM models, custom token pricing rates, and routing availability.
          </p>
        </div>
        <EmptyState
          icon={Boxes}
          title="No Project Selected"
          description="Please select a project from the header to configure its models and pricing."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Models &amp; Pricing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage supported LLM models, custom token pricing rates, and routing availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchModels} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Model
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Models Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Catalog of Supported Models</CardTitle>
            <CardDescription>
              Input and output prices are used to compute transparent cost estimations per request.
            </CardDescription>
          </div>
          {models.length > 0 && (
            <span className="text-xs font-mono text-slate-400">
              {models.length} {models.length === 1 ? 'model' : 'models'} configured
            </span>
          )}
        </CardHeader>
        <CardContent>
          {loading && models.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading model catalog...</div>
          ) : models.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No Models Configured"
              description="Your model catalog is currently blank. Add your first AI model to define token pricing and enable routing."
              actionLabel="Add Your First Model"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono bg-slate-50/50">
                    <th className="py-2.5 px-3 font-medium">Model Name &amp; ID</th>
                    <th className="py-2.5 px-3 font-medium">Provider</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium">Input / 1M Tokens</th>
                    <th className="py-2.5 px-3 font-medium">Output / 1M Tokens</th>
                    <th className="py-2.5 px-3 font-medium">Context Window</th>
                    <th className="py-2.5 px-3 font-medium">Streaming</th>
                    <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {models.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{m.modelId}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {m.provider}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleModel(m)}
                          className="cursor-pointer focus:outline-none"
                          title="Click to toggle status"
                        >
                          {m.isEnabled ? (
                            <Badge variant="success" className="cursor-pointer">
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="cursor-pointer">
                              Disabled
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800 font-medium">
                        ${m.inputPricePerMillion.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800 font-medium">
                        ${m.outputPricePerMillion.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {formatNumber(m.contextWindow)} tokens
                      </td>
                      <td className="py-3 px-3">
                        {m.supportsStreaming ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-mono text-[11px] font-medium">
                            <Zap className="w-3 h-3 text-emerald-600" /> SSE
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingModel(m);
                              setInputPrice(m.inputPricePerMillion.toString());
                              setOutputPrice(m.outputPricePerMillion.toString());
                            }}
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Pricing
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDeleteModel(m)}
                            title="Delete model"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Add Model Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Model"
        description="Configure a new LLM model with custom provider routing and token pricing."
      >
        <form onSubmit={handleAddModel} className="space-y-4">
          {addError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Provider *
            </label>
            <select
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
            >
              {PROVIDER_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Model Identifier (ID) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. nemotron-3.5-super-vl:free or gpt-4o-mini"
              value={newModelId}
              onChange={(e) => setNewModelId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              The exact model string sent by clients in the &quot;model&quot; parameter.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Nemotron 3.5 Super VL (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Input Price ($ / 1M tokens)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                required
                value={newInputPrice}
                onChange={(e) => setNewInputPrice(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Output Price ($ / 1M tokens)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                required
                value={newOutputPrice}
                onChange={(e) => setNewOutputPrice(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Context Window (Tokens)
            </label>
            <input
              type="number"
              min="1000"
              required
              value={newContextWindow}
              onChange={(e) => setNewContextWindow(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="supportsStreaming"
              checked={newSupportsStreaming}
              onChange={(e) => setNewSupportsStreaming(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="supportsStreaming" className="text-xs text-slate-700 cursor-pointer">
              Supports Server-Sent Events (SSE) Streaming
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={addingModel}>
              Save Model
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Pricing Modal */}
      <Modal
        isOpen={Boolean(editingModel)}
        onClose={() => setEditingModel(null)}
        title={`Edit Pricing: ${editingModel?.name}`}
        description="Update official or custom token pricing per 1,000,000 tokens in USD."
      >
        <form onSubmit={handleSavePricing} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Input Price (USD per 1M tokens)
            </label>
            <input
              type="number"
              step="0.0001"
              required
              value={inputPrice}
              onChange={(e) => setInputPrice(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Output Price (USD per 1M tokens)
            </label>
            <input
              type="number"
              step="0.0001"
              required
              value={outputPrice}
              onChange={(e) => setOutputPrice(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingModel(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Save Pricing
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
