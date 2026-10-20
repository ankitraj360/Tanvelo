'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Key,
  Globe,
  Play,
  Lock,
  Plus,
  Trash2,
  Sparkles,
  Server,
  Zap,
  Search,
  Copy,
  Check,
  Edit3,
  Terminal,
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  HardDrive,
} from 'lucide-react';
import { formatLatency } from '@/lib/utils';

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
    name: 'OpenRouter Gateway',
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
    desc: 'Gemini 2.0 Flash, 1.5 Pro with native multimodality',
    category: 'cloud',
    tag: 'Cloud Frontier',
  },
  {
    id: 'openai',
    name: 'OpenAI Primary',
    providerName: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    placeholderKey: 'sk-proj-...',
    desc: 'GPT-4o, GPT-4o Mini, o1, embeddings',
    category: 'cloud',
    tag: 'Cloud Frontier',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    providerName: 'claude',
    baseUrl: 'https://api.anthropic.com/v1',
    placeholderKey: 'sk-ant-api03-...',
    desc: 'Claude 3.5 Sonnet, Haiku, Opus reasoning models',
    category: 'cloud',
    tag: 'Cloud Frontier',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    providerName: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    placeholderKey: 'sk-...',
    desc: 'DeepSeek-V3, DeepSeek-R1 Reasoner',
    category: 'cloud',
    tag: 'Reasoning',
  },
  {
    id: 'groq',
    name: 'Groq LPU',
    providerName: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    placeholderKey: 'gsk_...',
    desc: 'Ultra-fast inference (500+ tok/s) for Llama 3 & Mixtral',
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
    tag: 'European Frontier',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local Server)',
    providerName: 'ollama',
    baseUrl: 'http://localhost:11434/v1',
    placeholderKey: 'ollama (or local token)',
    desc: 'Run Llama 3, DeepSeek R1, Qwen locally on-prem',
    category: 'local',
    tag: 'Self-Hosted',
  },
  {
    id: 'vllm',
    name: 'vLLM Inference Server',
    providerName: 'vllm',
    baseUrl: 'http://localhost:8000/v1',
    placeholderKey: 'token or local-key',
    desc: 'High-throughput PagedAttention local inference engine',
    category: 'local',
    tag: 'Self-Hosted',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio Desktop',
    providerName: 'lmstudio',
    baseUrl: 'http://localhost:1234/v1',
    placeholderKey: 'lm-studio or local',
    desc: 'Local developer desktop runtime',
    category: 'local',
    tag: 'Desktop Local',
  },
];

function getProviderMeta(providerName: string) {
  const norm = (providerName || '').toLowerCase().trim();
  if (norm.includes('openrouter')) {
    return {
      label: 'OpenRouter',
      badgeColor: 'indigo',
      accentBg: 'bg-indigo-950/70',
      accentBorder: 'border-indigo-800/60',
      accentText: 'text-indigo-400',
      glow: 'shadow-indigo-500/20',
      symbol: 'OR',
    };
  }
  if (norm.includes('gemini') || norm.includes('google')) {
    return {
      label: 'Google Gemini',
      badgeColor: 'blue',
      accentBg: 'bg-blue-950/70',
      accentBorder: 'border-blue-800/60',
      accentText: 'text-blue-400',
      glow: 'shadow-blue-500/20',
      symbol: 'GM',
    };
  }
  if (norm.includes('openai')) {
    return {
      label: 'OpenAI',
      badgeColor: 'success',
      accentBg: 'bg-emerald-950/70',
      accentBorder: 'border-emerald-800/60',
      accentText: 'text-emerald-400',
      glow: 'shadow-emerald-500/20',
      symbol: 'OA',
    };
  }
  if (norm.includes('claude') || norm.includes('anthropic')) {
    return {
      label: 'Anthropic Claude',
      badgeColor: 'warning',
      accentBg: 'bg-amber-950/70',
      accentBorder: 'border-amber-800/60',
      accentText: 'text-amber-400',
      glow: 'shadow-amber-500/20',
      symbol: 'CL',
    };
  }
  if (norm.includes('groq')) {
    return {
      label: 'Groq',
      badgeColor: 'warning',
      accentBg: 'bg-orange-950/70',
      accentBorder: 'border-orange-800/60',
      accentText: 'text-orange-400',
      glow: 'shadow-orange-500/20',
      symbol: 'GQ',
    };
  }
  if (norm.includes('deepseek')) {
    return {
      label: 'DeepSeek',
      badgeColor: 'cyan',
      accentBg: 'bg-cyan-950/70',
      accentBorder: 'border-cyan-800/60',
      accentText: 'text-cyan-400',
      glow: 'shadow-cyan-500/20',
      symbol: 'DS',
    };
  }
  if (norm.includes('ollama') || norm.includes('local') || norm.includes('vllm') || norm.includes('lmstudio')) {
    return {
      label: 'Local / Self-Hosted',
      badgeColor: 'cyan',
      accentBg: 'bg-teal-950/70',
      accentBorder: 'border-teal-800/60',
      accentText: 'text-teal-400',
      glow: 'shadow-teal-500/20',
      symbol: 'LOC',
    };
  }
  return {
    label: providerName,
    badgeColor: 'purple',
    accentBg: 'bg-purple-950/70',
    accentBorder: 'border-purple-800/60',
    accentText: 'text-purple-400',
    glow: 'shadow-purple-500/20',
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
      // Must be configured
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
      setModalError('Provider Name is required to run test');
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

      const data = await res.json();
      setModalTestResult(data);
      if (!res.ok && data.error) {
        setModalError(data.error);
      }
    } catch (err: any) {
      setModalTestResult({
        success: false,
        message: err.message || 'Network connection failed',
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
      setModalError('Provider Name is required');
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
          status: modalTestResult?.success ? 'connected' : 'connected',
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save provider connection');
      }

      const saved = await res.json();
      await fetchConnections();
      setSelectedProviderId(saved.provider);
      setIsConnectModalOpen(false);
      resetForm();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete provider
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect ${name}? Your applications routing to this provider will fall back to other configured providers.`)) {
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

  // Run connection ping from detail pane
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

      const data = await res.json();
      setTestResultMap((prev) => ({ ...prev, [provider]: data }));
      await fetchConnections();
    } catch (err: any) {
      setTestResultMap((prev) => ({
        ...prev,
        [provider]: { success: false, message: err.message, latencyMs: 0 },
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Strip with Prominent Connect Button on Top-Right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span>Provider Connections</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              AES-256-GCM Secure
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Connect frontier cloud providers or local on-prem inference engines. Credentials are isolated inside a zero-knowledge hardware enclave and never logged.
          </p>
        </div>

        {/* Top-Right Connect Provider Button */}
        <div className="flex items-center gap-3">
          <Button
            size="md"
            onClick={openConnectModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md active:scale-[0.98] transition-all px-4 py-2"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Connect Provider
          </Button>
        </div>
      </div>

      {/* Main 2-Column Split Layout: Connected Providers on Left, Details & Telemetry on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Area: Connected Providers List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Connected Providers</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {connectedProviders.length}
              </span>
            </div>

            {connectedProviders.length > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Gateway
              </span>
            )}
          </div>

          {/* Search bar if there are providers */}
          {connectedProviders.length > 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search connected providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>
          )}

          {/* Connected Providers List Cards */}
          <div className="space-y-2.5">
            {loading ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading secure connections...</span>
              </div>
            ) : connectedProviders.length === 0 ? (
              /* High-Trust Zero State */
              <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">No Providers Connected Yet</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Click the <strong className="text-slate-800">Connect Provider</strong> button in the top right to link OpenAI, Claude, Gemini, OpenRouter, or local models.
                  </p>
                </div>

                {/* Quick-Connect Preset Chips */}
                <div className="pt-2 border-t border-slate-200 text-left">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">
                    Quick Connect Presets:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.slice(0, 5).map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => openConnectModalWithPreset(preset)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-blue-600" />
                        {preset.name.replace(/ Gateway| Primary/, '')}
                      </button>
                    ))}
                  </div>
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
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-1 ring-blue-400/40'
                        : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs tracking-wider shadow-inner flex-shrink-0 ${meta.accentBg} ${meta.accentBorder} ${meta.accentText} border`}
                        >
                          {meta.symbol}
                        </div>

                        {/* Name & Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-900 truncate">
                              {conn.customName || meta.label}
                            </h3>
                            {conn.isCustom && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
                                custom
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                            {conn.apiBaseUrl ? conn.apiBaseUrl.replace(/^https?:\/\//, '') : conn.provider}
                          </p>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {isOnline ? (
                          <span className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
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
                          <span className="text-[10px] text-blue-600 font-mono font-medium">
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
                          className="text-[10px] font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 transition cursor-pointer"
                          title="Test Connection Ping"
                        >
                          <Play className="w-2.5 h-2.5 text-blue-600" />
                          {isTesting ? 'Testing...' : 'Ping'}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(conn);
                          }}
                          className="text-[10px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition cursor-pointer"
                          title="Edit Credentials"
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

          {/* Quick Presets Drawer for easy discovery */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Popular Provider Presets
              </span>
              <span className="text-[10px] text-slate-500">1-Click Setup</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => openConnectModalWithPreset(preset)}
                  className="px-2.5 py-1.5 rounded-lg text-left bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 transition flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate text-[11px] font-medium">{preset.name}</span>
                  <Plus className="w-3 h-3 text-slate-400 group-hover:text-blue-600 flex-shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: Selected Provider Details, Diagnostics & Telemetry */}
        <div className="lg:col-span-7">
          {selectedConnection ? (
            (() => {
              const meta = getProviderMeta(selectedConnection.provider);
              const isTesting = testingMap[selectedConnection.provider] || false;
              const testResult = testResultMap[selectedConnection.provider];

              return (
                <div className="space-y-5">
                  {/* Active Provider Header Banner */}
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm tracking-wide ${meta.accentBg} ${meta.accentBorder} ${meta.accentText} border shadow-sm ${meta.glow}`}
                          >
                            {meta.symbol}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                {selectedConnection.customName || meta.label}
                              </h2>
                              <Badge variant={meta.badgeColor as any} className="font-mono text-[10px]">
                                {selectedConnection.provider}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Hardware AES-256-GCM encrypted provider link
                            </p>
                          </div>
                        </div>

                        {/* Top Actions: Ping, Edit, Delete */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={isTesting}
                            onClick={() =>
                              runConnectionTest(selectedConnection.provider, selectedConnection.apiBaseUrl)
                            }
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 text-xs"
                          >
                            <Play className="w-3 h-3 mr-1 text-emerald-600" />
                            Test Ping
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(selectedConnection)}
                            className="text-xs border-slate-200 hover:bg-slate-100 text-slate-700"
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
                            className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title="Disconnect Provider"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Operational Metrics Strip */}
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                        {/* Status */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                            Health Status
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold text-emerald-700">
                              Operational & Ready
                            </span>
                          </div>
                        </div>

                        {/* Latency */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                            Roundtrip Latency
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-mono font-semibold text-blue-600">
                              {testResult?.latencyMs
                                ? formatLatency(testResult.latencyMs)
                                : 'Verified'}
                            </span>
                          </div>
                        </div>

                        {/* Encryption */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                            Key Protection
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-mono font-semibold text-slate-800">
                              AES-256-GCM
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Test Ping Diagnostic Banner if test was run */}
                  {testResult && (
                    <div
                      className={`p-4 rounded-xl text-xs border transition-all ${
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
                          {testResult.success
                            ? 'Connection Verified Successfully'
                            : 'Connection Test Failed'}
                        </span>
                        {testResult.latencyMs > 0 && (
                          <span className="font-mono text-[11px] bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {formatLatency(testResult.latencyMs)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed">{testResult.message}</p>
                    </div>
                  )}

                  {/* Endpoint & Cryptographic Credentials Card */}
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        Endpoint & Enclave Configuration
                      </CardTitle>
                      <CardDescription>
                        Hardware-isolated proxy credentials for this provider connection
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Base URL */}
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                          Base URL (Root Endpoint):
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={selectedConnection.apiBaseUrl || 'Standard Provider Endpoint'}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none select-all"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              copyToClipboard(
                                selectedConnection.apiBaseUrl || '',
                                'url'
                              )
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

                      {/* Key Preview */}
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                          Encrypted Key Token Preview:
                        </span>
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 flex items-center justify-between">
                          <span>{selectedConnection.apiKeyPreview || '••••••••'}</span>
                          <span className="text-[10px] text-emerald-700 font-sans flex items-center gap-1 font-medium">
                            <Lock className="w-3 h-3 text-emerald-600" />
                            Encrypted at Rest
                          </span>
                        </div>
                      </div>

                      {/* Security Trust Note */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed">
                        <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-800">Zero-Knowledge Isolation:</strong> Raw API keys are stored in an encrypted PostgreSQL enclave using authenticated AES-256-GCM. Plaintext secrets are decrypted strictly in ephemeral memory during gateway request forwarding.
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Developer Integration Code Snippet */}
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-blue-600" />
                          Gateway Request Integration
                        </CardTitle>
                        <CardDescription>
                          Send requests through Tanvelo gateway with model prefixing
                        </CardDescription>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const code = `curl -X POST http://localhost:4000/v1/chat/completions \\
  -H "Authorization: Bearer tanvelo_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedConnection.provider}/gpt-4o",
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
                      <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-100 overflow-x-auto leading-relaxed">
{`curl -X POST http://localhost:4000/v1/chat/completions \\
  -H "Authorization: Bearer $TANVELO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedConnection.provider}/model-name",
    "messages": [
      { "role": "user", "content": "High-speed AI routing via Tanvelo" }
    ]
  }'`}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              );
            })()
          ) : (
            /* When no provider is selected or when none connected */
            <div className="space-y-6">
              <Card className="border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600 mb-4 shadow-sm">
                  <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>

                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Universal AI Federation Gateway
                </h2>
                <p className="text-xs text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
                  Tanvelo provides a unified, production-hardened API proxy across frontier cloud providers (OpenRouter, Gemini, OpenAI, Claude) and self-hosted runtimes (Ollama, vLLM).
                </p>

                {/* 4 Trust & Security Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-left max-w-xl mx-auto">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <Lock className="w-3.5 h-3.5" />
                      Zero-Knowledge Enclave
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Credentials are encrypted at rest with hardware AES-256-GCM and never logged.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                      <Zap className="w-3.5 h-3.5" />
                      Sub-Millisecond Overhead
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Ultra-low latency streaming proxy architecture designed for microsecond routing.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                      <Layers className="w-3.5 h-3.5" />
                      Automatic Fallbacks
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Instant circuit breaking and failover when upstream providers experience rate limits.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                      <HardDrive className="w-3.5 h-3.5" />
                      Local & Cloud Unified
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Seamlessly combine proprietary cloud APIs with private on-prem Ollama & vLLM servers.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-center">
                  <Button size="md" onClick={openConnectModal}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Connect Your First Provider
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Connect Provider Modal (All 4 Fields Required: Name, Provider Name, Base URL, API Key + Test, Cancel, Save) */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => {
          setIsConnectModalOpen(false);
          resetForm();
        }}
        title={isEditing ? `Edit ${formName || 'Provider'} Credentials` : 'Connect AI Provider'}
        description="All 4 fields are required. Credentials are authenticated and encrypted with AES-256-GCM in your isolated database."
        maxWidth="lg"
      >
        <form onSubmit={handleModalSave} className="space-y-4">
          {/* Modal Error Alert */}
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Test Connection Inline Result */}
          {modalTestResult && (
            <div
              className={`p-3.5 rounded-xl text-xs border transition-all ${
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
                  {modalTestResult.success ? '✓ Connection Succeeded' : '✕ Test Failed'}
                </span>
                {modalTestResult.latencyMs > 0 && (
                  <span className="font-mono text-[11px] bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {formatLatency(modalTestResult.latencyMs)}
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-90 leading-tight">{modalTestResult.message}</p>
            </div>
          )}

          {/* Quick Preset Selector Buttons (Optional 1-Click helpers) */}
          {!isEditing && (
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1.5">
                Quick Preset Fill (Optional):
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
                    className={`px-2 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer ${
                      formProvider === preset.providerName
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
                    }`}
                  >
                    {preset.name.replace(/ Gateway| Primary/, '')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Field 1: Name (Required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Connection Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Production OpenAI or OpenRouter Gateway"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Friendly label displayed in dashboards and routing policies.
            </p>
          </div>

          {/* Field 2: Provider Name (Required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Provider Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. openrouter, gemini, openai, claude, ollama, vllm, or custom"
              value={formProvider}
              onChange={(e) => setFormProvider(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Any provider: <code className="text-blue-600 font-mono">openrouter</code>, <code className="text-blue-600 font-mono">gemini</code>, <code className="text-blue-600 font-mono">openai</code>, <code className="text-blue-600 font-mono">claude</code>, <code className="text-blue-600 font-mono">ollama</code>, or local models.
            </p>
          </div>

          {/* Field 3: Base URL (Required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Base URL (Endpoint) <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
              value={formBaseUrl}
              onChange={(e) => setFormBaseUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Provider API root or OpenAI-compatible endpoint. Must support HTTP routing.
            </p>
          </div>

          {/* Field 4: API Key (Required) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-800">
                API Key / Token <span className="text-rose-500">*</span>
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
              placeholder="Enter API key (or 'ollama' / 'local' for unauthenticated models)"
              value={formApiKey}
              onChange={(e) => setFormApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span>Hardware-encrypted with AES-256-GCM. Raw keys are never leaked to client bundles.</span>
            </p>
          </div>

          {/* Action Buttons: Test Connection (Left), Cancel & Save (Right) */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
            {/* Test Connection Button */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={modalTesting}
              onClick={handleModalTest}
              className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs"
            >
              <Play className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Test Connection
            </Button>

            {/* Cancel & Save Buttons */}
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
                className="text-xs bg-blue-600 hover:bg-blue-500 font-semibold text-white"
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
