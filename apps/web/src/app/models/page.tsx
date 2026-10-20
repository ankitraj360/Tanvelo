'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Edit3, Zap } from 'lucide-react';
import { formatNumber, parseApiResponse } from '@/lib/utils';

interface Model {
  id: string;
  provider: string;
  modelId: string;
  name: string;
  contextWindow: number;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  isEnabled: boolean;
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Pricing Modal State
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [inputPrice, setInputPrice] = useState('');
  const [outputPrice, setOutputPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        setModels(await parseApiResponse(res));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Models & Pricing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage supported LLM models, custom token pricing rates, and routing availability.
          </p>
        </div>
      </div>

      {/* Models Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Catalog of Supported Models</CardTitle>
          <CardDescription>
            Input and output prices are used to compute transparent cost estimations per request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono bg-slate-50/50">
                  <th className="py-2.5 px-3 font-medium">Model Name & ID</th>
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
                      <span className="capitalize font-medium text-slate-700">{m.provider}</span>
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
