'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  CheckCircle2,
  AlertTriangle,
  Key,
  Globe,
  Play,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Search,
  Copy,
  Check,
  Edit3,
  Cpu,
  Layers,
  Server,
  Code2,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { formatLatency, extractErrorMessage } from '@/lib/utils';
import {
  PROVIDER_CATALOG,
  ProviderDefinition,
  ProviderCategory,
  getProviderMeta,
} from '@/lib/providers';

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

const CATEGORY_TABS: { id: ProviderCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Providers' },
  { id: 'cloud', label: 'Frontier Cloud' },
  { id: 'fast', label: 'Ultra-Fast & Silicon' },
  { id: 'enterprise', label: 'Enterprise Cloud' },
  { id: 'regional', label: 'Regional & Asian' },
  { id: 'local', label: 'Self-Hosted / Local' },
  { id: 'unified', label: 'Routers & Unified' },
  { id: 'specialized', label: 'Specialized' },
  { id: 'custom', label: 'Custom / Any API' },
];

export default function ProvidersPage() {
  const { currentProject } = useProject();
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchConnectedQuery, setSearchConnectedQuery] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Catalog Explorer state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory | 'all'>('all');

  // Connect Provider Modal State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'preset' | 'custom'>('preset');
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formAuthType, setFormAuthType] = useState<'bearer' | 'azure' | 'custom' | 'none'>('bearer');
  const [formCustomHeaderName, setFormCustomHeaderName] = useState('X-API-Key');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTestResult, setModalTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs: number;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [presetSearch, setPresetSearch] = useState('');

  // Page-level testing
  const [testingMap, setTestingMap] = useState<Record<string, boolean>>({});
  const [testResultMap, setTestResultMap] = useState<
    Record<string, { success: boolean; message: string; latencyMs: number }>
  >({});
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'ts' | 'py'>('ts');
  const [addingModelMap, setAddingModelMap] = useState<Record<string, boolean>>({});
  const [addedModelSuccess, setAddedModelSuccess] = useState<string | null>(null);

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

      if (!searchConnectedQuery.trim()) return true;
      const q = searchConnectedQuery.toLowerCase().trim();
      return (
        c.provider.toLowerCase().includes(q) ||
        (c.customName && c.customName.toLowerCase().includes(q)) ||
        (c.apiBaseUrl && c.apiBaseUrl.toLowerCase().includes(q))
      );
    });
  }, [connections, searchConnectedQuery]);

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

  const selectedCatalogEntry = useMemo(() => {
    if (!selectedConnection) return null;
    const norm = selectedConnection.provider.toLowerCase();
    return PROVIDER_CATALOG.find((p) => p.id === norm || (p.aliases && p.aliases.includes(norm))) || null;
  }, [selectedConnection]);

  // Filtered catalog list for bottom exploration area
  const filteredCatalog = useMemo(() => {
    let list = PROVIDER_CATALOG;
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (!catalogSearch.trim()) return list;
    const q = catalogSearch.toLowerCase().trim();
    return list.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.aliases && p.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  }, [selectedCategory, catalogSearch]);

  // Filtered preset list inside modal
  const modalPresets = useMemo(() => {
    if (!presetSearch.trim()) return PROVIDER_CATALOG.slice(0, 36);
    const q = presetSearch.toLowerCase().trim();
    return PROVIDER_CATALOG.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q) ||
        (p.aliases && p.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  }, [presetSearch]);

  // Reset form
  const resetForm = () => {
    setFormName('');
    setFormProvider('');
    setFormBaseUrl('');
    setFormApiKey('');
    setFormAuthType('bearer');
    setFormCustomHeaderName('X-API-Key');
    setIsEditing(false);
    setModalError(null);
    setModalTestResult(null);
    setPresetSearch('');
  };

  // Open modal for new connection
  const openConnectModal = (initialTab: 'preset' | 'custom' = 'preset') => {
    resetForm();
    setModalTab(initialTab);
    setIsConnectModalOpen(true);
  };

  // Open modal with specific preset
  const openConnectModalWithPreset = (preset: ProviderDefinition) => {
    resetForm();
    setModalTab('preset');
    setFormName(preset.name);
    setFormProvider(preset.id);
    setFormBaseUrl(preset.baseUrl);
    setFormApiKey('');
    if (preset.id === 'azure' || preset.id === 'azure_ai') {
      setFormAuthType('azure');
    } else if (preset.category === 'local') {
      setFormAuthType('none');
    } else {
      setFormAuthType('bearer');
    }
    setIsConnectModalOpen(true);
  };

  // Open modal to edit existing connection
  const openEditModal = (conn: ProviderConnection) => {
    resetForm();
    setIsEditing(true);
    setModalTab(conn.isCustom ? 'custom' : 'preset');
    setFormName(conn.customName || getProviderMeta(conn.provider).label);
    setFormProvider(conn.provider);
    setFormBaseUrl(conn.apiBaseUrl || '');
    setFormApiKey('');
    setIsConnectModalOpen(true);
  };

  // Build effective key format for backend
  const computeKeyForSave = (): string => {
    if (formAuthType === 'none') {
      return formApiKey.trim() || 'local-key';
    }
    if (formAuthType === 'azure') {
      return `api-key: ${formApiKey.trim()}`;
    }
    if (formAuthType === 'custom' && formCustomHeaderName.trim()) {
      return `${formCustomHeaderName.trim()}: ${formApiKey.trim()}`;
    }
    return formApiKey.trim();
  };

  // Modal: Test connection
  const handleModalTest = async () => {
    if (!formProvider.trim()) {
      setModalError('Provider identifier is required');
      return;
    }
    if (!formBaseUrl.trim()) {
      setModalError('Base URL is required to test endpoint');
      return;
    }

    const testKey = computeKeyForSave();

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
          apiKey: testKey,
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
      setModalError('Connection display name is required');
      return;
    }
    if (!formProvider.trim()) {
      setModalError('Provider identifier is required');
      return;
    }
    if (!formBaseUrl.trim()) {
      setModalError('Base URL is required');
      return;
    }

    const normProvider = formProvider.toLowerCase().trim();
    const isLocal =
      normProvider === 'ollama' ||
      normProvider === 'vllm' ||
      normProvider === 'lmstudio' ||
      formAuthType === 'none' ||
      formBaseUrl.includes('localhost') ||
      formBaseUrl.includes('127.0.0.1');

    if (!formApiKey.trim() && !isLocal) {
      setModalError('API Key is required for cloud providers');
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    const isCustom = modalTab === 'custom' || !['openai', 'anthropic', 'claude', 'gemini'].includes(normProvider);
    const keyToSave = computeKeyForSave();

    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          provider: normProvider,
          customName: formName.trim(),
          apiBaseUrl: formBaseUrl.trim(),
          apiKey: keyToSave,
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
    if (
      !confirm(
        `Are you sure you want to disconnect ${name}? Applications routing to this provider will fall back to other configured providers.`
      )
    ) {
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
        const text = await res.text().catch(() => '');
        data = { success: false, message: text || `HTTP ${res.status}`, latencyMs: 0 };
      }

      const isSuccess = Boolean(res.ok && data?.success);
      const msg = extractErrorMessage(
        data?.message || data?.error,
        isSuccess ? 'Connection verified successfully.' : 'Connection test failed.'
      );

      setTestResultMap((prev) => ({
        ...prev,
        [provider]: {
          success: isSuccess,
          message: msg,
          latencyMs: typeof data?.latencyMs === 'number' ? data.latencyMs : 0,
        },
      }));

      // Update connected provider state in list
      setConnections((prev) =>
        prev.map((c) =>
          c.provider === provider
            ? {
                ...c,
                status: isSuccess ? 'connected' : 'error',
                lastTestedAt: new Date().toISOString(),
                lastError: isSuccess ? null : msg,
              }
            : c
        )
      );
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

  // 1-Click Add Recommended Model to Project
  const handleAddRecommendedModel = async (model: {
    id: string;
    name: string;
    contextWindow?: number;
    inputPricePerMillion?: number;
    outputPricePerMillion?: number;
    supportsStreaming?: boolean;
  }) => {
    if (!currentProject || !selectedConnection) return;
    setAddingModelMap((prev) => ({ ...prev, [model.id]: true }));
    setAddedModelSuccess(null);

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          modelId: model.id,
          name: model.name,
          provider: selectedConnection.provider,
          inputPricePerMillion: model.inputPricePerMillion || 0,
          outputPricePerMillion: model.outputPricePerMillion || 0,
          contextWindow: model.contextWindow || 128000,
          supportsStreaming: model.supportsStreaming !== false,
          isEnabled: true,
        }),
      });

      if (res.ok) {
        setAddedModelSuccess(`Model "${model.name}" registered to project!`);
        setTimeout(() => setAddedModelSuccess(null), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || err?.message || 'Failed to add model to project');
      }
    } catch (e: any) {
      alert(e.message || 'Network error adding model');
    } finally {
      setAddingModelMap((prev) => ({ ...prev, [model.id]: false }));
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

  // Dynamic code example using current provider
  const sampleModel =
    selectedCatalogEntry?.recommendedModels?.[0]?.id || `${selectedConnection?.provider || 'provider'}/custom-model`;

  const tsCodeSnippet = `import { Tanvelo } from "@tanvelo/sdk";

const tanvelo = new Tanvelo({
  apiKey: process.env.TANVELO_API_KEY, // "tv-live-..."
});

// Call ${selectedConnection?.customName || selectedConnection?.provider} with automated gateway routing
const response = await tanvelo.chat.completions.create({
  model: "${selectedConnection?.provider}/${sampleModel}",
  messages: [
    { role: "user", content: "Hello from Tanvelo unified gateway!" }
  ],
});

console.log(response.choices[0].message.content);`;

  const pyCodeSnippet = `from tanvelo import Tanvelo

client = Tanvelo(api_key="tv-live-...")

# Call ${selectedConnection?.customName || selectedConnection?.provider} seamlessly
response = client.chat.completions.create(
    model="${selectedConnection?.provider}/${sampleModel}",
    messages=[{"role": "user", "content": "Hello Tanvelo!"}]
)

print(response.choices[0].message.content)`;

  const curlCodeSnippet = `curl -X POST https://tanvelo-backend-zgyc.onrender.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer tv-live-..." \\
  -d '{
    "model": "${selectedConnection?.provider}/${sampleModel}",
    "messages": [
      { "role": "user", "content": "Hello Tanvelo unified gateway!" }
    ]
  }'`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Provider Connections
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              140+ AI Providers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Connect OpenAI, Anthropic, Gemini, Groq, Cerebras, Together, DeepSeek, vLLM, or ANY custom OpenAI-compatible API.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openConnectModal('custom')}
            className="text-xs font-medium border-slate-300"
          >
            <Server className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            Add Custom API
          </Button>

          <Button
            size="sm"
            onClick={() => openConnectModal('preset')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Connect Provider
          </Button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Connected</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900">{connectedProviders.length}</span>
            <span className="text-[11px] text-emerald-600 font-medium">active in project</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Supported Providers</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900">{PROVIDER_CATALOG.length}+</span>
            <span className="text-[11px] text-blue-600 font-medium">pre-integrated</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Custom Endpoints</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900">
              {connections.filter((c) => c.isCustom).length}
            </span>
            <span className="text-[11px] text-purple-600 font-medium">vLLM / on-prem</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Latency Verification</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-emerald-600">Live</span>
            <span className="text-[11px] text-slate-500 font-mono">active healthcheck</span>
          </div>
        </div>
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
            <button
              onClick={() => openConnectModal('preset')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add More
            </button>
          </div>

          {/* Search connected providers */}
          {connectedProviders.length > 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search connected providers..."
                value={searchConnectedQuery}
                onChange={(e) => setSearchConnectedQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
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
              <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
                  <Cpu className="w-5 h-5 text-slate-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">No Providers Connected</h3>
                  <p className="text-xs text-slate-500">
                    Connect OpenAI, Anthropic, Gemini, Groq, Cerebras, Together, or your custom API endpoint.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <Button size="sm" onClick={() => openConnectModal('preset')}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Browse 140+ Providers
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openConnectModal('custom')}>
                    <Server className="w-3.5 h-3.5 mr-1" />
                    Custom API
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
                        ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
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
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
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
                              {selectedCatalogEntry && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                  {selectedCatalogEntry.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 font-mono truncate max-w-sm">
                              {selectedConnection.apiBaseUrl || selectedCatalogEntry?.baseUrl || 'Standard API Endpoint'}
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
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

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Category</span>
                          <span className="text-xs font-medium text-slate-800 capitalize mt-0.5 block">
                            {meta.category || 'General AI'}
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

                  {/* Recommended Models Section */}
                  {selectedCatalogEntry?.recommendedModels && selectedCatalogEntry.recommendedModels.length > 0 && (
                    <Card className="border-slate-200 bg-white">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            Popular Models for {selectedCatalogEntry.name}
                          </CardTitle>
                          {addedModelSuccess && (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {addedModelSuccess}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedCatalogEntry.recommendedModels.map((m) => (
                            <div
                              key={m.id}
                              className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-slate-900">{m.name}</span>
                                  <code className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    {m.id}
                                  </code>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  Context: {m.contextWindow ? `${(m.contextWindow / 1000).toFixed(0)}k` : '128k'} | In: ${m.inputPricePerMillion ?? 0}/M | Out: ${m.outputPricePerMillion ?? 0}/M
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                loading={addingModelMap[m.id]}
                                onClick={() => handleAddRecommendedModel(m)}
                                className="text-[11px] h-7 px-2 border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add to Project
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Code Integration Card */}
                  <Card className="border-slate-200 bg-white overflow-hidden">
                    <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-blue-600" />
                          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                            Gateway Routing Snippet
                          </CardTitle>
                        </div>

                        {/* Language Tabs */}
                        <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg">
                          <button
                            onClick={() => setActiveCodeTab('ts')}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                              activeCodeTab === 'ts' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            TypeScript
                          </button>
                          <button
                            onClick={() => setActiveCodeTab('py')}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                              activeCodeTab === 'py' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Python
                          </button>
                          <button
                            onClick={() => setActiveCodeTab('curl')}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                              activeCodeTab === 'curl' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            cURL
                          </button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 relative">
                      <pre className="p-4 bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                        {activeCodeTab === 'ts' && tsCodeSnippet}
                        {activeCodeTab === 'py' && pyCodeSnippet}
                        {activeCodeTab === 'curl' && curlCodeSnippet}
                      </pre>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            activeCodeTab === 'ts' ? tsCodeSnippet : activeCodeTab === 'py' ? pyCodeSnippet : curlCodeSnippet,
                            'snippet'
                          )
                        }
                        className="absolute right-3 top-3 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Copy Code"
                      >
                        {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
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
                Select a Connected Provider
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select a connected provider on the left to verify latency and view integration snippets, or connect a new provider below.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button size="sm" onClick={() => openConnectModal('preset')}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Connect Provider
                </Button>
                <Button size="sm" variant="outline" onClick={() => openConnectModal('custom')}>
                  <Server className="w-4 h-4 mr-1.5" />
                  Add Custom API
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Explore 140+ Supported AI Providers Catalog */}
      <div className="pt-8 border-t border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Explore 140+ Pre-Configured Providers
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any provider to connect instantly with pre-filled endpoints and configurations.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 140+ providers (Together, Cerebras, Bedrock...)"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            const count =
              tab.id === 'all'
                ? PROVIDER_CATALOG.length
                : PROVIDER_CATALOG.filter((p) => p.category === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredCatalog.map((provider) => {
            const isConnected = connections.some(
              (c) => c.provider.toLowerCase() === provider.id.toLowerCase() && c.status === 'connected'
            );

            return (
              <div
                key={provider.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                      {provider.name}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-100 text-slate-600 flex-shrink-0">
                      {provider.tag}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {provider.description}
                  </p>

                  <div className="mt-2 text-[10px] font-mono text-slate-400 truncate">
                    {provider.baseUrl.replace(/^https?:\/\//, '')}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {isConnected ? (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {provider.id}
                    </span>
                  )}

                  <Button
                    size="sm"
                    variant={isConnected ? 'secondary' : 'outline'}
                    onClick={() => openConnectModalWithPreset(provider)}
                    className="text-[11px] h-6 px-2.5"
                  >
                    {isConnected ? 'Manage' : 'Connect'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connect Provider Modal */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => {
          setIsConnectModalOpen(false);
          resetForm();
        }}
        title={isEditing ? `Edit ${formName || 'Provider'}` : 'Connect AI Provider'}
        description="Configure your upstream API provider credentials or custom endpoint."
        maxWidth="lg"
      >
        <form onSubmit={handleModalSave} className="space-y-4">
          {/* Modal Header Tabs */}
          {!isEditing && (
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setModalTab('preset')}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalTab === 'preset' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Browse 140+ Providers
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab('custom');
                  if (!formProvider) setFormProvider('custom-model');
                  if (!formBaseUrl) setFormBaseUrl('https://api.yourdomain.com/v1');
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalTab === 'custom' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Server className="w-3.5 h-3.5 text-purple-600" />
                Custom Endpoint / Any API
              </button>
            </div>
          )}

          {/* Preset Selector Grid (if on preset tab) */}
          {modalTab === 'preset' && !isEditing && (
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700">Select Provider Preset:</span>
                <span className="text-[10px] text-slate-400">147 available</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter (Together, Cerebras, Fireworks, Groq, Bedrock...)"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pt-1">
                {modalPresets.map((p) => {
                  const isSelected = formProvider.toLowerCase() === p.id.toLowerCase();
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setFormName(p.name);
                        setFormProvider(p.id);
                        setFormBaseUrl(p.baseUrl);
                        if (p.id === 'azure' || p.id === 'azure_ai') {
                          setFormAuthType('azure');
                        } else if (p.category === 'local') {
                          setFormAuthType('none');
                        } else {
                          setFormAuthType('bearer');
                        }
                        setModalError(null);
                        setModalTestResult(null);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-medium border transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className={`text-[9px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        ({p.tag})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Together AI, Cerebras, On-Prem vLLM"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Provider Slug / Prefix <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. cerebras, together, my-custom-model"
                value={formProvider}
                onChange={(e) => setFormProvider(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              API Base URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://api.together.xyz/v1 or http://localhost:8000/v1"
              value={formBaseUrl}
              onChange={(e) => setFormBaseUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
              The root API endpoint where /chat/completions resides.
            </span>
          </div>

          {/* Auth Header Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Authentication Format</label>
              <select
                value={formAuthType}
                onChange={(e) => setFormAuthType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="bearer">Bearer Token (Authorization: Bearer &lt;key&gt;)</option>
                <option value="azure">Azure Header (api-key: &lt;key&gt;)</option>
                <option value="custom">Custom Header (e.g. X-API-Key)</option>
                <option value="none">No Auth / Local (Ollama, vLLM)</option>
              </select>
            </div>

            {formAuthType === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Custom Header Name</label>
                <input
                  type="text"
                  value={formCustomHeaderName}
                  onChange={(e) => setFormCustomHeaderName(e.target.value)}
                  placeholder="e.g. X-API-Key or App-Token"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
            )}
          </div>

          {formAuthType !== 'none' && (
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                API Key / Secret Token <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                placeholder="Paste upstream API key here..."
                value={formApiKey}
                onChange={(e) => setFormApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Encrypted with server-side AES-256-GCM at rest. Never logged in plaintext.
              </span>
            </div>
          )}

          {/* Modal Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              loading={modalTesting}
              onClick={handleModalTest}
              className="text-xs"
            >
              <Play className="w-3 h-3 mr-1 text-emerald-600" />
              Test Connection
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConnectModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={modalSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
              >
                Save Connection
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
