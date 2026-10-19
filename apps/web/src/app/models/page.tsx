'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Boxes, Edit3, CheckCircle2, XCircle, Zap, DollarSign, Layers } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface ModelConfig {
  id: string;
  modelId: string;
  name: string;
  provider: string;
  isEnabled: boolean;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  contextWindow: number;
  supportsStreaming: boolean;
}

export default function ModelsPage() {
  const { currentProject } = useProject();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [inputPrice, setInputPrice] = useState('');
  const [outputPrice, setOutputPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchModels = async () => {
    if (!currentProject) return;
    try {
      const res = await fetch(`/api/models?projectId=${currentProject.id}`);
      if (res.ok) {
        setModels(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [currentProject]);

  const toggleModel = async (model: ModelConfig) => {
    try {
      const res = await fetch(`/api/models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !model.isEnabled }),
      });
      if (res.ok) {
        await fetchModels();
      }
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

      if (res.ok) {
        await fetchModels();
        setEditingModel(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Models & Pricing</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage supported LLM models, custom token pricing rates, and routing availability.
          </p>
        </div>
      </div>

      {/* Models Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Catalog of Supported Models</CardTitle>
          <CardDescription>
            Input and output prices are used to compute transparent cost estimations per request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-medium">Model Name & ID</th>
                  <th className="pb-3 font-medium">Provider</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Input / 1M Tokens</th>
                  <th className="pb-3 font-medium">Output / 1M Tokens</th>
                  <th className="pb-3 font-medium">Context Window</th>
                  <th className="pb-3 font-medium">Streaming</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5">
                      <div className="font-semibold text-slate-200">{m.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{m.modelId}</div>
                    </td>
                    <td className="py-3.5">
                      <span className="capitalize font-medium text-slate-300">{m.provider}</span>
                    </td>
                    <td className="py-3.5">
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
                    <td className="py-3.5 font-mono text-slate-300">
                      ${m.inputPricePerMillion.toFixed(2)}
                    </td>
                    <td className="py-3.5 font-mono text-slate-300">
                      ${m.outputPricePerMillion.toFixed(2)}
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">
                      {formatNumber(m.contextWindow)} tokens
                    </td>
                    <td className="py-3.5">
                      {m.supportsStreaming ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                          <Zap className="w-3 h-3" /> SSE
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Pricing Modal */}
      <Modal
        isOpen={Boolean(editingModel)}
        onClose={() => setEditingModel(null)}
        title={`Edit Pricing: ${editingModel?.name}`}
        description="Update official or custom token pricing per 1,000,000 tokens in USD."
      >
        <form onSubmit={handleSavePricing} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Input Price (USD per 1M tokens)
            </label>
            <input
              type="number"
              step="0.0001"
              required
              value={inputPrice}
              onChange={(e) => setInputPrice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Output Price (USD per 1M tokens)
            </label>
            <input
              type="number"
              step="0.0001"
              required
              value={outputPrice}
              onChange={(e) => setOutputPrice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
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
