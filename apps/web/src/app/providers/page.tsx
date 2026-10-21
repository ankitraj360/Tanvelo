'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  CheckCircle2,
  AlertTriangle,
  Key,
  Globe,
  Play,
  Lock,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Search,
  Copy,
  Check,
  Edit3,
  Terminal,
  Cpu,
} from 'lucide-react';
import { formatLatency, extractErrorMessage } from '@/lib/utils';

interface ProviderConnection {
  id: string;
  provider: string;
  customName?: string | null;
  isCustom?: boolean;
  apiKeyPreview: string;
  apiBaseUrl?: string | null;
  status: 'unconfigured' | 'connected' | 'error';
  lastTestedAt?: string | null;
  lastError?: string | null;
}

interface ProviderPreset {
  id: string;
  name: string;
  providerName: string;
  baseUrl: string;
  placeholderKey: string;
  desc: string;
  category: 'cloud' | 'local' | 'unified';
  tag: string;
}

const PRESETS: ProviderPreset[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    providerName: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    placeholderKey: 'sk-or-v1-...',
    desc: 'Access 200+ frontier models through unified API',
    category: 'unified',
    tag: 'Unified',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    providerName: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    placeholderKey: 'AIzaSy...',
    desc: 'Gemini 2.5 Flash, 2.5 Pro native models',
    category: 'cloud',
    tag: 'Cloud Frontier',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    providerName: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    placeholderKey: 'sk-proj-...',
    desc: 'GPT-4o, GPT-4o Mini, o1, o3-mini',
    category: 'cloud',
    tag: 'Cloud Frontier',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    providerName: 'claude',
    baseUrl: 'https://api.anthropic.com/v1',
    placeholderKey: 'sk-ant-api03-...',
    desc: 'Claude 3.5 Sonnet, Haiku reasoning models',
    category: 'cloud',
    tag: 'Cloud Frontier',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    providerName: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    placeholderKey: 'sk-...',
    desc: 'DeepSeek-V3, DeepSeek-R1',
    category: 'cloud',
    tag: 'Reasoning',
  },
  {
    id: 'groq',
    name: 'Groq',
    providerName: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    placeholderKey: 'gsk_...',
    desc: 'High-speed inference for Llama 3 & Mixtral',
    category: 'cloud',
    tag: 'Ultra-Fast',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    providerName: 'mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    placeholderKey: '...',
    desc: 'Mistral Large, Codestral, Pixtral',
    category: 'cloud',
    tag: 'Frontier',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    providerName: 'ollama',
    baseUrl: 'http://localhost:11434/v1',
    placeholderKey: 'ollama (or local token)',
    desc: 'Run Llama 3, DeepSeek R1 locally',
    category: 'local',
    tag: 'Self-Hosted',
  },
  {
    id: 'vllm',
    name: 'vLLM Server',
    providerName: 'vllm',
    baseUrl: 'http://localhost:8000/v1',
    placeholderKey: 'token or local-key',
    desc: 'High-throughput local inference engine',
    category: 'local',
    tag: 'Self-Hosted',
  },
];

function getProviderMeta(providerName: string) {
  const norm = (providerName || '').toLowerCase().trim();
  if (norm.includes('openrouter')) {
    return {
      label: 'OpenRouter',
      badgeColor: 'indigo',
      accentBg: 'bg-indigo-50',
      accentBorder: 'border-indigo-200',
      accentText: 'text-indigo-700',
      symbol: 'OR',
    };
  }
  if (norm.includes('gemini') || norm.includes('google')) {
    return {
      label: 'Google Gemini',
      badgeColor: 'blue',
      accentBg: 'bg-blue-50',
      accentBorder: 'border-blue-200',
      accentText: 'text-blue-700',
      symbol: 'GM',
    };
  }
  if (norm.includes('openai')) {
    return {
      label: 'OpenAI',
      badgeColor: 'success',
      accentBg: 'bg-emerald-50',
      accentBorder: 'border-emerald-200',
      accentText: 'text-emerald-700',
      symbol: 'OA',
    };
  }
  if (norm.includes('claude') || norm.includes('anthropic')) {
    return {
      label: 'Anthropic Claude',
      badgeColor: 'warning',
      accentBg: 'bg-amber-50',
      accentBorder: 'border-amber-200',
      accentText: 'text-amber-700',
      symbol: 'CL',
    };
  }
  if (norm.includes('groq')) {
    return {
      label: 'Groq',
      badgeColor: 'warning',
      accentBg: 'bg-orange-50',
      accentBorder: 'border-orange-200',
      accentText: 'text-orange-700',
      symbol: 'GQ',
    };
  }
  if (norm.includes('deepseek')) {
    return {
      label: 'DeepSeek',
      badgeColor: 'cyan',
      accentBg: 'bg-cyan-50',
      accentBorder: 'border-cyan-200',
      accentText: 'text-cyan-700',
      symbol: 'DS',
    };
  }
  if (norm.includes('ollama') || norm.includes('local') || norm.includes('vllm') || norm.includes('lmstudio')) {
    return {
      label: 'Local / Self-Hosted',
      badgeColor: 'cyan',
      accentBg: 'bg-teal-50',
      accentBorder: 'border-teal-200',
      accentText: 'text-teal-700',
      symbol: 'LOC',
    };
  }
  return {
    label: providerName,
    badgeColor: 'purple',
    accentBg: 'bg-purple-50',
    accentBorder: 'border-purple-200',
    accentText: 'text-purple-700',
    symbol: providerName.slice(0, 2).toUpperCase() || 'AI',
  };
}

export default function ProvidersPage() {
  const { currentProject } = useProject();
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Connect Provider Modal State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTestResult, setModalTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs: number;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Page-level testing
  const [testingMap, setTestingMap] = useState<Record<string, boolean>>({});
  const [testResultMap, setTestResultMap] = useState<
    Record<string, { success: boolean; message: string; latencyMs: number }>
  >({});
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchConnections = async () => {
    if (!currentProject) return;
    try {
      const res = await fetch(`/api/providers?projectId=${currentProject.id}`);
      if (res.ok) {
        const data: ProviderConnection[] = await res.json();
        setConnections(data);

        // Auto-select first connected provider if none selected
        if (!selectedProviderId && data.length > 0) {
          const firstConnected = data.find(
            (c) => c.status === 'connected' || (c.apiKeyPreview && c.apiKeyPreview !== 'None')
          );
          if (firstConnected) setSelectedProviderId(firstConnected.provider);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [currentProject]);

  // Filter connected providers for left area
  const connectedProviders = useMemo(() => {
    return connections.filter((c) => {
      const isConfigured = c.status === 'connected' || (c.apiKeyPreview && c.apiKeyPreview !== 'None');
      if (!isConfigured) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.provider.toLowerCase().includes(q) ||
        (c.customName && c.customName.toLowerCase().includes(q)) ||
        (c.apiBaseUrl && c.apiBaseUrl.toLowerCase().includes(q))
      );
    });
  }, [connections, searchQuery]);

  // Keep selected provider valid
  useEffect(() => {
    if (connectedProviders.length > 0) {
      const exists = connectedProviders.some((c) => c.provider === selectedProviderId);
      if (!exists && !selectedProviderId) {
        setSelectedProviderId(connectedProviders[0].provider);
      }
    } else {
      setSelectedProviderId(null);
    }
  }, [connectedProviders, selectedProviderId]);

  const selectedConnection = useMemo(() => {
    return connections.find((c) => c.provider === selectedProviderId) || null;
  }, [connections, selectedProviderId]);

  // Reset form
  const resetForm = () => {
    setFormName('');
    setFormProvider('');
    setFormBaseUrl('');
    setFormApiKey('');
    setShowApiKey(false);
    setIsEditing(false);
    setModalError(null);
    setModalTestResult(null);
  };

  // Open modal for new connection
  const openConnectModal = () => {
    resetForm();
    setIsConnectModalOpen(true);
  };

  // Open modal with specific preset
  const openConnectModalWithPreset = (preset: ProviderPreset) => {
    resetForm();
    setFormName(preset.name);
    setFormProvider(preset.providerName);
    setFormBaseUrl(preset.baseUrl);
    setFormApiKey('');
    setIsConnectModalOpen(true);
  };

  // Open modal to edit existing connection
  const openEditModal = (conn: ProviderConnection) => {
    resetForm();
    setIsEditing(true);
    setFormName(conn.customName || getProviderMeta(conn.provider).label);
    setFormProvider(conn.provider);
    setFormBaseUrl(conn.apiBaseUrl || '');
    setFormApiKey('');
    setIsConnectModalOpen(true);
  };

  // Modal: Test connection
  const handleModalTest = async () => {
    if (!formProvider.trim()) {
      setModalError('Provider name is required to run test');
      return;
    }
    if (!formBaseUrl.trim()) {
      setModalError('Base URL is required to run test');
      return;
    }
    if (!formApiKey.trim()) {
      setModalError('API Key is required to run test');
      return;
    }

    setModalTesting(true);
    setModalTestResult(null);
    setModalError(null);

    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject?.id,
          provider: formProvider.toLowerCase().trim(),
          apiKey: formApiKey.trim(),
          apiBaseUrl: formBaseUrl.trim(),
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        data = { success: false, message: text || `HTTP ${res.status}`, latencyMs: 0 };
      }

      const isSuccess = Boolean(res.ok && data?.success);
      const msg = extractErrorMessage(
        data?.message || data?.error,
        isSuccess ? 'Connection verified successfully.' : 'Connection test failed.'
      );

      const safeResult = {
        success: isSuccess,
        message: msg,
        latencyMs: typeof data?.latencyMs === 'number' ? data.latencyMs : 0,
      };

      setModalTestResult(safeResult);
      if (!isSuccess) {
        setModalError(msg);
      }
    } catch (err: any) {
      const errMsg = extractErrorMessage(err, 'Network connection failed');
      setModalError(errMsg);
      setModalTestResult({
        success: false,
        message: errMsg,
        latencyMs: 0,
      });
    } finally {
      setModalTesting(false);
    }
  };

  // Modal: Save provider connection
  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    if (!formName.trim()) {
      setModalError('Name is required');
      return;
    }
    if (!formProvider.trim()) {
      setModalError('Provider name is required');
      return;
    }
    if (!formBaseUrl.trim()) {
      setModalError('Base URL is required');
      return;
    }
    if (!formApiKey.trim()) {
      setModalError('API Key is required');
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    const normProvider = formProvider.toLowerCase().trim();
    const isCustom = !['openai', 'anthropic', 'claude', 'gemini'].includes(normProvider);

    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          provider: normProvider,
          customName: formName.trim(),
          apiBaseUrl: formBaseUrl.trim(),
          apiKey: formApiKey.trim(),
          isCustom,
          status: 'connected',
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(extractErrorMessage(data?.error || data?.message, 'Failed to save provider connection'));
      }

      await fetchConnections();
      setSelectedProviderId(data?.provider || normProvider);
      setIsConnectModalOpen(false);
      resetForm();
    } catch (err: any) {
      setModalError(extractErrorMessage(err, 'Failed to save provider connection'));
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete provider
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect ${name}? Applications routing to this provider will fall back to other configured providers.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/providers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchConnections();
        setSelectedProviderId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Run connection ping from detail pane or card
  const runConnectionTest = async (provider: string, baseUrl?: string | null) => {
    if (!currentProject) return;
    setTestingMap((prev) => ({ ...prev, [provider]: true }));
    setTestResultMap((prev) => {
      const next = { ...prev };
      delete next[provider];
      return next;
    });

    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          provider,
          apiBaseUrl: baseUrl || undefined,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = { success: false, message: `HTTP ${res.status} response`, latencyMs: 0 };
      }

      const isSuccess = Boolean(res.ok && data?.success);
      const msg = extractErrorMessage(
        data?.message || data?.error,
        isSuccess ? 'Connection verified successfully.' : 'Connection test failed.'
      );

      const safeResult = {
        success: isSuccess,
        message: msg,
        latencyMs: typeof data?.latencyMs === 'number' ? data.latencyMs : 0,
      };

      setTestResultMap((prev) => ({ ...prev, [provider]: safeResult }));
      await fetchConnections();
    } catch (err: any) {
      setTestResultMap((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          message: extractErrorMessage(err, 'Network failure'),
          latencyMs: 0,
        },
      }));
    } finally {
      setTestingMap((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const copyToClipboard = (text: string, type: 'snippet' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'snippet') {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const gatewayUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}`
      : 'https://tanvelo-backend-zgyc.onrender.com';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Provider Connections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure upstream AI providers and API credentials for gateway routing.
          </p>
        </div>

        <Button
          size="sm"
          onClick={openConnectModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Connect Provider
        </Button>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Area: Connected Providers List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Connected Providers
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 text-slate-700">
                {connectedProviders.length}
              </span>
            </div>
          </div>

          {/* Search bar */}
          {connectedProviders.length > 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search connected providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>
          )}

          {/* Connected Providers List Cards */}
          <div className="space-y-2.5">
            {loading ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading provider connections...</span>
              </div>
            ) : connectedProviders.length === 0 ? (
              <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
                  <Cpu className="w-5 h-5 text-slate-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">No Providers Connected</h3>
                  <p className="text-xs text-slate-500">
                    Connect OpenAI, Anthropic, Gemini, Groq, or local inference models to start routing.
                  </p>
                </div>
                <div className="pt-2">
                  <Button size="sm" onClick={openConnectModal}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Connect Provider
                  </Button>
                </div>
              </div>
            ) : (
              connectedProviders.map((conn) => {
                const meta = getProviderMeta(conn.provider);
                const isSelected = selectedProviderId === conn.provider;
                const isTesting = testingMap[conn.provider] || false;
                const testResult = testResultMap[conn.provider];
                const isOnline = conn.status === 'connected';

                return (
                  <div
                    key={conn.id}
                    onClick={() => setSelectedProviderId(conn.provider)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs tracking-wider flex-shrink-0 ${meta.accentBg} ${meta.accentBorder} ${meta.accentText} border`}
                        >
                          {meta.symbol}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-semibold text-slate-900 truncate">
                              {conn.customName || meta.label}
                            </h3>
                            {conn.isCustom && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
                                custom
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[180px]">
                            {conn.apiBaseUrl ? conn.apiBaseUrl.replace(/^https?:\/\//, '') : conn.provider}
                          </p>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {isOnline ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Connected
                          </span>
                        ) : conn.status === 'error' ? (
                          <span className="text-[10px] text-rose-700 font-medium px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                            Error
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                            Idle
                          </span>
                        )}

                        {testResult?.latencyMs ? (
                          <span className="text-[10px] text-blue-600 font-mono">
                            ⚡ {formatLatency(testResult.latencyMs)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Bottom strip: key preview & actions */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                        <Key className="w-3 h-3 text-slate-400" />
                        <span>{conn.apiKeyPreview || '••••••••'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            runConnectionTest(conn.provider, conn.apiBaseUrl);
                          }}
                          disabled={isTesting}
                          className="text-[10px] font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1 transition cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5 text-blue-600" />
                          {isTesting ? 'Testing...' : 'Ping'}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(conn);
                          }}
                          className="text-[10px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Presets */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Popular Presets
              </span>
              <span className="text-[10px] text-slate-500">Click to connect</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => openConnectModalWithPreset(preset)}
                  className="px-2.5 py-1.5 rounded-lg text-left bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate text-[11px] font-medium">{preset.name}</span>
                  <Plus className="w-3 h-3 text-slate-400 group-hover:text-blue-600 flex-shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: Selected Provider Details */}
        <div className="lg:col-span-7">
          {selectedConnection ? (
            (() => {
              const meta = getProviderMeta(selectedConnection.provider);
              const isTesting = testingMap[selectedConnection.provider] || false;
              const testResult = testResultMap[selectedConnection.provider];

              return (
                <div className="space-y-4">
                  {/* Active Provider Header */}
                  <Card className="border-slate-200 bg-white">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${meta.accentBg} ${meta.accentBorder} ${meta.accentText} border`}
                          >
                            {meta.symbol}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-base font-bold text-slate-900">
                                {selectedConnection.customName || meta.label}
                              </h2>
                              <Badge variant={meta.badgeColor as any} className="font-mono text-[10px]">
                                {selectedConnection.provider}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 font-mono truncate max-w-sm">
                              {selectedConnection.apiBaseUrl || 'Default Provider Endpoint'}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={isTesting}
                            onClick={() =>
                              runConnectionTest(selectedConnection.provider, selectedConnection.apiBaseUrl)
                            }
                            className="text-xs"
                          >
                            <Play className="w-3 h-3 mr-1 text-emerald-600" />
                            Test Connection
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(selectedConnection)}
                            className="text-xs"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>

                          <button
                            onClick={() =>
                              handleDelete(
                                selectedConnection.id,
                                selectedConnection.customName || meta.label
                              )
                            }
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                            title="Disconnect Provider"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Operational Metrics */}
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Status</span>
                          <span className="text-xs font-semibold text-emerald-700 mt-0.5 block">
                            {selectedConnection.status === 'connected' ? 'Connected' : selectedConnection.status}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Latency</span>
                          <span className="text-xs font-mono font-semibold text-slate-800 mt-0.5 block">
                            {testResult?.latencyMs ? formatLatency(testResult.latencyMs) : '—'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Key Token</span>
                          <span className="text-xs font-mono font-semibold text-slate-800 mt-0.5 block">
                            {selectedConnection.apiKeyPreview || '••••••••'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ping Result Banner */}
                  {testResult && (
                    <div
                      className={`p-3.5 rounded-xl text-xs border transition-all ${
                        testResult.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="flex items-center gap-1.5">
                          {testResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                          )}
                          {testResult.success ? 'Connection Verified' : 'Connection Failed'}
                        </span>
                        {testResult.latencyMs > 0 && (
                          <span className="font-mono text-[11px] bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {formatLatency(testResult.latencyMs)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        {typeof testResult.message === 'string' ? testResult.message : JSON.stringify(testResult.message)}
                      </p>
                    </div>
                  )}

                  {/* Endpoint Configuration */}
                  <Card className="border-slate-200 bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Endpoint Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                          Base URL:
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={selectedConnection.apiBaseUrl || 'Standard Provider Endpoint'}
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 select-all"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              copyToClipboard(selectedConnection.apiBaseUrl || '', 'url')
                            }
                            className="px-2.5 text-xs"
                          >
                            {copiedUrl ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>API keys are encrypted at rest and used only during gateway request routing.</span>
                      </p>
                    </CardContent>
                  </Card>

                  {/* Integration Example */}
                  <Card className="border-slate-200 bg-white">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Request Example
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const code = `curl -X POST ${gatewayUrl}/v1/chat/completions \\
  -H "Authorization: Bearer $TANVELO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedConnection.provider}/model-name",
    "messages": [{"role": "user", "content": "Hello Tanvelo Gateway!"}]
  }'`;
                          copyToClipboard(code, 'snippet');
                        }}
                        className="text-xs"
                      >
                        {copiedSnippet ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Check className="w-3.5 h-3.5" /> Copied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Copy className="w-3.5 h-3.5" /> Copy cURL
                          </span>
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <pre className="p-3.5 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-100 overflow-x-auto leading-relaxed">
{`curl -X POST ${gatewayUrl}/v1/chat/completions \\
  -H "Authorization: Bearer $TANVELO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedConnection.provider}/model-name",
    "messages": [
      { "role": "user", "content": "Hello Tanvelo!" }
    ]
  }'`}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              );
            })()
          ) : (
            <Card className="border-slate-200 bg-white p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-500 mb-3">
                <Cpu className="w-6 h-6 text-slate-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Provider Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select a connected provider on the left to test latency and view endpoints, or connect a new provider.
              </p>
              <div className="mt-4">
                <Button size="sm" onClick={openConnectModal}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Connect Provider
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Connect Provider Modal */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => {
          setIsConnectModalOpen(false);
          resetForm();
        }}
        title={isEditing ? `Edit ${formName || 'Provider'}` : 'Connect Provider'}
        description="Configure your upstream AI model provider credentials."
        maxWidth="lg"
      >
        <form onSubmit={handleModalSave} className="space-y-4">
          {/* Modal Error Alert */}
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{typeof modalError === 'string' ? modalError : JSON.stringify(modalError)}</span>
            </div>
          )}

          {/* Test Connection Inline Result */}
          {modalTestResult && (
            <div
              className={`p-3 rounded-lg text-xs border transition-all ${
                modalTestResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center justify-between font-semibold mb-0.5">
                <span className="flex items-center gap-1.5">
                  {modalTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  {modalTestResult.success ? 'Connection Succeeded' : 'Test Failed'}
                </span>
                {modalTestResult.latencyMs > 0 && (
                  <span className="font-mono text-[11px] bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {formatLatency(modalTestResult.latencyMs)}
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-90 leading-tight">
                {typeof modalTestResult.message === 'string'
                  ? modalTestResult.message
                  : JSON.stringify(modalTestResult.message)}
              </p>
            </div>
          )}

          {/* Quick Presets inside modal */}
          {!isEditing && (
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
                Quick Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setFormName(preset.name);
                      setFormProvider(preset.providerName);
                      setFormBaseUrl(preset.baseUrl);
                      setModalError(null);
                      setModalTestResult(null);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                      formProvider.toLowerCase() === preset.providerName.toLowerCase()
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Field 1: Custom Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Connection Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. OpenAI Production, Google Gemini, Ollama Local"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Field 2: Provider identifier */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Provider Identifier <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="openai, anthropic, gemini, groq, deepseek, ollama..."
              value={formProvider}
              onChange={(e) => setFormProvider(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Field 3: Base URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Base URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://api.openai.com/v1"
              value={formBaseUrl}
              onChange={(e) => setFormBaseUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Field 4: API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-800">
                API Key / Secret Token <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-[10px] text-slate-500 hover:text-slate-800 transition"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showApiKey ? 'text' : 'password'}
              required
              placeholder="Enter provider API key (or 'ollama' / 'local' for unauthenticated models)"
              value={formApiKey}
              onChange={(e) => setFormApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
            />
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span>Keys are encrypted at rest and never returned in plaintext.</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={modalTesting}
              onClick={handleModalTest}
              className="text-xs"
            >
              <Play className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Test Connection
            </Button>

            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsConnectModalOpen(false);
                  resetForm();
                }}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                loading={modalSubmitting}
                className="text-xs bg-blue-600 hover:bg-blue-700 font-semibold text-white"
              >
                {isEditing ? 'Save Changes' : 'Save Provider'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
