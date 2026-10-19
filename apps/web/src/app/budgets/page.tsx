'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { Coins, AlertTriangle, ShieldCheck, Settings, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function BudgetsPage() {
  const { currentProject } = useProject();
  const [budget, setBudget] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit budget modal
  const [isOpen, setIsOpen] = useState(false);
  const [maxBudget, setMaxBudget] = useState('100');
  const [warningThreshold, setWarningThreshold] = useState('80');
  const [hardLimit, setHardLimit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchBudgetData = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?projectId=${currentProject.id}`);
      if (res.ok) {
        const data = await res.json();
        setBudget(data.budget);
        setAlerts(data.alerts || []);
        if (data.budget) {
          setMaxBudget(data.budget.maxBudgetUsd.toString());
          setWarningThreshold(data.budget.warningThresholdPercent.toString());
          setHardLimit(data.budget.hardLimitEnabled);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [currentProject]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          maxBudgetUsd: parseFloat(maxBudget),
          warningThresholdPercent: parseFloat(warningThreshold),
          hardLimitEnabled: hardLimit,
        }),
      });

      if (res.ok) {
        await fetchBudgetData();
        setIsOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const spend = budget?.currentSpendUsd || 0;
  const limit = budget?.maxBudgetUsd || 100;
  const percentUsed = Math.min(100, (spend / limit) * 100);
  const isWarning = percentUsed >= (budget?.warningThresholdPercent || 80);
  const isExceeded = spend >= limit;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Usage & Budgets</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforce spending limits, automated alerts, and hard cutoffs on LLM gateway consumption.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Settings className="w-4 h-4 mr-1.5" /> Configure Budget
        </Button>
      </div>

      {/* Budget Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Spend vs Monthly Limit</CardTitle>
              <CardDescription>
                Calculated from actual completed request token usage and model pricing
              </CardDescription>
            </div>
            {budget?.hardLimitEnabled ? (
              <Badge variant="cyan" className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Hard Limit Enforced
              </Badge>
            ) : (
              <Badge variant="outline">Soft Alert Only</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold text-slate-100 font-mono">
                {formatCurrency(spend)}
              </span>
              <span className="text-xs text-slate-400 ml-2">of {formatCurrency(limit)} limit</span>
            </div>
            <span className="font-mono text-sm font-semibold text-slate-300">
              {percentUsed.toFixed(1)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Warning Threshold</span>
              <span className="font-mono text-slate-300 font-medium">
                {budget?.warningThresholdPercent || 80}% ({formatCurrency((limit * (budget?.warningThresholdPercent || 80)) / 100)})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Hard Cutoff</span>
              <span className="font-mono text-slate-300 font-medium">
                {budget?.hardLimitEnabled ? 'Enabled (Blocks at 100%)' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Billing Cycle</span>
              <span className="font-mono text-slate-300 font-medium capitalize">
                {budget?.period || 'Monthly'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Alert History</CardTitle>
          <CardDescription>Logged threshold notifications and enforcement actions</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No budget alerts triggered"
              description="Spending is within normal parameters. Alerts will appear here if threshold or cutoff limits are reached."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Severity</th>
                    <th className="pb-3 font-medium">Title & Message</th>
                    <th className="pb-3 font-medium text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {alerts.map((alt) => (
                    <tr key={alt.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 font-mono capitalize text-slate-300">
                        {alt.alertType.replace('_', ' ')}
                      </td>
                      <td className="py-3">
                        <Badge variant={alt.severity === 'critical' ? 'destructive' : 'warning'}>
                          {alt.severity}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-200">{alt.title}</div>
                        <div className="text-[11px] text-slate-400">{alt.message}</div>
                      </td>
                      <td className="py-3 text-slate-500 text-right">
                        {new Date(alt.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configure Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Configure Budget & Safeguards"
        description="Set maximum spending limits and hard request blocking."
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Max Monthly Budget (USD)
            </label>
            <input
              type="number"
              step="1"
              required
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Warning Threshold (%)
            </label>
            <input
              type="number"
              min="1"
              max="99"
              required
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
            <input
              type="checkbox"
              id="hardLimit"
              checked={hardLimit}
              onChange={(e) => setHardLimit(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
            />
            <label htmlFor="hardLimit" className="text-xs text-slate-300 cursor-pointer">
              <span className="font-semibold block text-slate-200">Enforce Hard Limit</span>
              Prevent all new gateway requests with HTTP 429 when budget reaches 100%.
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Save Budget Settings
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
