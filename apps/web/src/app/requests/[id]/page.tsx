'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatLatency, formatNumber } from '@/lib/utils';
import {
  ArrowLeft,
  Clock,
  Coins,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

export default function RequestInspectorPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/requests/${requestId}`);
        if (res.ok) {
          setRequest(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [requestId]);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (loading) {
    return <div className="text-slate-400 text-xs py-12">Loading request inspection details...</div>;
  }

  if (!request) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto">
        <h3 className="text-slate-200 font-semibold text-base">Request Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">
          No request with ID &quot;{requestId}&quot; was recorded in the database.
        </p>
        <Link href="/requests" className="text-xs text-blue-400 mt-4 inline-block hover:underline">
          ← Return to API Requests
        </Link>
      </div>
    );
  }

  const gatewayOverheadMs = Math.max(0, request.totalLatencyMs - request.providerLatencyMs);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/requests"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono">
                {request.requestId}
              </h1>
              <Badge
                variant={
                  request.status === 'success'
                    ? 'success'
                    : request.status === 'rate_limited'
                    ? 'warning'
                    : 'destructive'
                }
              >
                {request.statusCode} {request.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Captured on {new Date(request.createdAt).toLocaleString()} • IP: {request.clientIp || '127.0.0.1'}
            </p>
          </div>
        </div>
      </div>

      {/* Latency & Cost Breakdown Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-400 block font-medium">Total Latency</span>
            <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
              {formatLatency(request.totalLatencyMs)}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Provider: {formatLatency(request.providerLatencyMs)} • Gateway: {formatLatency(gatewayOverheadMs)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-400 block font-medium">Token Consumption</span>
            <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
              {formatNumber(request.totalTokens)}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Input: {formatNumber(request.inputTokens)} • Output: {formatNumber(request.outputTokens)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-400 block font-medium">Estimated Cost</span>
            <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
              {formatCurrency(request.estimatedCost)}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Calculated from model token rates</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-400 block font-medium">Routing Target</span>
            <div className="text-xl font-bold text-slate-100 mt-1 capitalize">{request.provider}</div>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{request.model}</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Routing & Fallback Sequence Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Routing & Fallback Execution Sequence</CardTitle>
          <CardDescription>
            Chronological log of upstream provider attempts and outcomes for this request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {request.attempts?.length === 0 ? (
            <p className="text-xs text-slate-500">
              No upstream attempts executed (rejected prior to routing, e.g. key validation or rate limit).
            </p>
          ) : (
            <div className="space-y-3">
              {request.attempts.map((att: any, idx: number) => (
                <div
                  key={att.id || idx}
                  className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
                    att.isSuccess
                      ? 'bg-slate-900 border-emerald-800/60'
                      : 'bg-rose-950/20 border-rose-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        att.isSuccess
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {att.attemptNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 capitalize">{att.provider}</span>
                        <span className="font-mono text-[11px] text-slate-400">{att.model}</span>
                        <Badge variant={att.isSuccess ? 'success' : 'destructive'}>
                          HTTP {att.statusCode}
                        </Badge>
                      </div>

                      {att.errorMessage && (
                        <p className="text-[11px] text-rose-300 mt-1 font-mono">{att.errorMessage}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-slate-300 block">{formatLatency(att.latencyMs)}</span>
                    <span className="text-[10px] text-slate-500">
                      {att.isSuccess ? 'Response Delivered' : 'Triggered Fallback'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sanitized Payload Viewers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Payload */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm">Sanitized Request Body</CardTitle>
              <CardDescription>Secrets and auth tokens redacted</CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                copyToClipboard(
                  JSON.stringify(request.requestBodySanitized, null, 2),
                  'req'
                )
              }
            >
              {copiedSection === 'req' ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy JSON
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96">
              {JSON.stringify(request.requestBodySanitized, null, 2) || '{}'}
            </pre>
          </CardContent>
        </Card>

        {/* Response Payload */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm">Sanitized Response Body</CardTitle>
              <CardDescription>Returned to client application</CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                copyToClipboard(
                  JSON.stringify(request.responseBodySanitized, null, 2),
                  'res'
                )
              }
            >
              {copiedSection === 'res' ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy JSON
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96">
              {JSON.stringify(request.responseBodySanitized, null, 2) || '{}'}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
