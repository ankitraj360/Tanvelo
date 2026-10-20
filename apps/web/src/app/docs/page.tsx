'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Copy, Check, Terminal, Code2, BookOpen, Layers, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function DocsPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const tanveloTsSnippet = `import { Tanvelo } from '@tanvelo/sdk';

// Initialize the Tanvelo Client
const tanvelo = new Tanvelo({
  apiKey: process.env.TANVELO_API_KEY, // or 'tanvelo_live_...'
  baseUrl: 'http://localhost:4000/v1',
});

async function run() {
  // Call any provider: OpenAI, Anthropic, Gemini, DeepSeek, Groq, Ollama
  const response = await tanvelo.chat.completions.create({
    model: 'gpt-4o',
    fallbacks: ['claude-3-5-sonnet', 'gemini-1.5-pro'],
    messages: [
      { role: 'system', content: 'You are an intelligent code assistant.' },
      { role: 'user', content: 'Explain Tanvelo gateway architecture.' }
    ],
    temperature: 0.7,
  });

  console.log(response.choices[0].message.content);
  console.log('Provider used:', response._tanvelo?.provider);
  console.log('Latency:', response._tanvelo?.latencyMs, 'ms');
}

run();`;

  const tanveloPySnippet = `from tanvelo import Tanvelo

# Initialize Tanvelo Client
client = Tanvelo(
    api_key="YOUR_TANVELO_API_KEY",
    base_url="http://localhost:4000/v1"
)

# 1. Standard Completion across any provider
response = client.chat.completions.create(
    model="claude-3-5-sonnet", # or gpt-4o, gemini-1.5-pro, deepseek-chat
    fallbacks=["gpt-4o-mini", "gemini-1.5-flash"],
    messages=[
        {"role": "user", "content": "Generate a clean TypeScript interface."}
    ]
)
print(response.content)

# 2. Real-Time Streaming
for chunk in client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Stream a short explanation."}],
    stream=True
):
    print(chunk.delta, end="", flush=True)`;

  const curlSnippet = `curl -X POST http://localhost:4000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TANVELO_API_KEY" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain Tanvelo federation gateway."}
    ],
    "temperature": 0.7
  }'`;

  const openAiSdkSnippet = `import OpenAI from "openai";

// Tanvelo is 100% drop-in compatible with the OpenAI SDK
const openai = new OpenAI({
  baseURL: "http://localhost:4000/v1",
  apiKey: "YOUR_TANVELO_API_KEY",
});

const response = await openai.chat.completions.create({
  model: "claude-3-5-sonnet", // Tanvelo transparently translates to Anthropic
  messages: [{ role: "user", content: "Hello from OpenAI SDK via Tanvelo!" }],
});

console.log(response.choices[0].message.content);`;

  const webhookSnippet = `import crypto from 'crypto';

// Verify Tanvelo webhook signatures
function verifyTanveloWebhook(payloadRaw, signatureHeader, secret) {
  // Signature header format: "t=TIMESTAMP,v1=SIGNATURE"
  const parts = Object.fromEntries(
    signatureHeader.split(',').map(p => p.split('='))
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${payloadRaw}\`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="cyan">Developer Reference</Badge>
          <Badge variant="outline">Official SDK v1.0</Badge>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Tanvelo Gateway & SDK Documentation
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Tanvelo provides a unified, production-grade LLM API Gateway and dedicated SDKs. Call OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Groq, Mistral, and local Ollama models with a single script and built-in rate-limiting, deterministic fallbacks, budgets, and token metering.
        </p>
      </div>

      {/* Quickstart 3-Step Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200 mb-2">
              1
            </span>
            <h4 className="font-semibold text-slate-900 text-xs">Connect Providers</h4>
            <p className="text-[11px] text-slate-500">
              Add your OpenAI, Anthropic, Gemini, or custom endpoints under <strong className="text-slate-800">Providers</strong>. Keys are AES-256 encrypted.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="w-6 h-6 rounded-full bg-cyan-50 text-cyan-600 font-bold text-xs flex items-center justify-center border border-cyan-200 mb-2">
              2
            </span>
            <h4 className="font-semibold text-slate-900 text-xs">Generate Gateway Key</h4>
            <p className="text-[11px] text-slate-500">
              Create an authenticated gateway key under <strong className="text-slate-800">API Keys</strong>. Only SHA-256 hashes are persisted.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center border border-purple-200 mb-2">
              3
            </span>
            <h4 className="font-semibold text-slate-900 text-xs">Call Any Model via SDK</h4>
            <p className="text-[11px] text-slate-500">
              Use <code className="text-blue-600 font-mono text-[10px]">@tanvelo/sdk</code> in TypeScript or <code className="text-blue-600 font-mono text-[10px]">tanvelo</code> in Python to route calls instantly.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Official Tanvelo SDK Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Official Tanvelo SDK (TypeScript & Python)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              One unified SDK to call OpenAI, Anthropic, Gemini, DeepSeek, or Ollama with automatic model fallback.
            </p>
          </div>
          <Badge variant="cyan">Recommended</Badge>
        </div>

        {/* TypeScript SDK */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-mono text-blue-600">TypeScript / Node.js SDK (@tanvelo/sdk)</CardTitle>
              <CardDescription>Install with npm install @tanvelo/sdk</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => copyCode(tanveloTsSnippet, 10)}>
              {copiedIndex === 10 ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />}
              {copiedIndex === 10 ? 'Copied' : 'Copy Code'}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 overflow-x-auto">
              {tanveloTsSnippet}
            </pre>
          </CardContent>
        </Card>

        {/* Python SDK */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-mono text-emerald-600">Python SDK (tanvelo.py)</CardTitle>
              <CardDescription>Native zero-dependency Python client with streaming & fallback support</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => copyCode(tanveloPySnippet, 20)}>
              {copiedIndex === 20 ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />}
              {copiedIndex === 20 ? 'Copied' : 'Copy Code'}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 overflow-x-auto">
              {tanveloPySnippet}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Specification */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" className="font-mono">POST</Badge>
            <CardTitle className="font-mono text-sm text-slate-900">/v1/chat/completions</CardTitle>
          </div>
          <CardDescription>
            OpenAI-compatible chat completion endpoint supporting standard JSON and Server-Sent Events (SSE) streaming.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-800 block">Headers:</span>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
              <div>Content-Type: application/json</div>
              <div>Authorization: Bearer YOUR_TANVELO_API_KEY</div>
              <div className="text-blue-600">X-Tanvelo-Fallbacks: claude-3-5-sonnet,gemini-1.5-pro (optional)</div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-800 block">Response Headers:</span>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
              <div><span className="text-blue-600 font-semibold">X-Tanvelo-Request-Id</span>: req_c82fa0...</div>
              <div><span className="text-blue-600 font-semibold">X-Tanvelo-Provider</span>: openai (or anthropic / gemini / deepseek)</div>
              <div><span className="text-blue-600 font-semibold">X-Tanvelo-Model</span>: gpt-4o</div>
              <div><span className="text-blue-600 font-semibold">X-RateLimit-Limit</span>: 60</div>
              <div><span className="text-blue-600 font-semibold">X-RateLimit-Remaining</span>: 59</div>
              <div><span className="text-blue-600 font-semibold">X-RateLimit-Reset</span>: 45</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Integration Examples */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-600" /> cURL & Drop-in OpenAI SDK Compatibility
        </h3>

        {/* cURL */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-blue-600">cURL Direct Call</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => copyCode(curlSnippet, 1)}>
              {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />}
              {copiedIndex === 1 ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 overflow-x-auto">
              {curlSnippet}
            </pre>
          </CardContent>
        </Card>

        {/* OpenAI Drop-in SDK */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-purple-600">OpenAI SDK (Zero Code Change Drop-in)</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => copyCode(openAiSdkSnippet, 2)}>
              {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />}
              {copiedIndex === 2 ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 overflow-x-auto">
              {openAiSdkSnippet}
            </pre>
          </CardContent>
        </Card>

        {/* Webhooks Verification */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-amber-600">Webhook Signature Verification (HMAC-SHA256)</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => copyCode(webhookSnippet, 4)}>
              {copiedIndex === 4 ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />}
              {copiedIndex === 4 ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 overflow-x-auto">
              {webhookSnippet}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
