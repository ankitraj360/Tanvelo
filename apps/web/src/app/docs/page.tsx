'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Copy, Check, Terminal, Code2, BookOpen, Layers, ShieldCheck, Zap } from 'lucide-react';

export default function DocsPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const curlSnippet = `curl -X POST http://localhost:4000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TANVELO_API_KEY" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a helpful coding assistant."},
      {"role": "user", "content": "Explain the architecture of Tanvelo LLM Gateway."}
    ],
    "temperature": 0.7,
    "max_tokens": 1024
  }'`;

  const pythonSnippet = `from openai import OpenAI

# Tanvelo is 100% drop-in compatible with the OpenAI SDK
client = OpenAI(
    base_url="http://localhost:4000/v1",
    api_key="YOUR_TANVELO_API_KEY"
)

response = client.chat.completions.create(
    model="gpt-4o",  # or claude-3-5-sonnet, gemini-1.5-pro, or a routing alias
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello Tanvelo!"}
    ],
    temperature=0.7,
)

print(response.choices[0].message.content)
print("Tokens used:", response.usage.total_tokens)`;

  const nodeSnippet = `import OpenAI from "openai";

// Drop-in OpenAI SDK integration
const client = new OpenAI({
  baseURL: "http://localhost:4000/v1",
  apiKey: "YOUR_TANVELO_API_KEY",
});

async function run() {
  const stream = await client.chat.completions.create({
    model: "claude-3-5-sonnet-20241022",
    messages: [{ role: "user", content: "Stream this response!" }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

run();`;

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
          <Badge variant="outline">API v1.0</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Tanvelo Gateway API Documentation
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Tanvelo provides a unified, production-grade LLM API Gateway. It translates requests seamlessly across OpenAI, Anthropic, and Google Gemini while enforcing rate-limiting, deterministic fallbacks, budgets, and transparent token metering.
        </p>
      </div>

      {/* Quickstart 3-Step Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-700/60 mb-2">
              1
            </span>
            <h4 className="font-semibold text-slate-200 text-xs">Configure Providers</h4>
            <p className="text-[11px] text-slate-400">
              Add your OpenAI, Anthropic, or Gemini API keys under <strong className="text-slate-300">Providers</strong>. Credentials are AES-256 encrypted.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="w-6 h-6 rounded-full bg-cyan-900/50 text-cyan-400 font-bold text-xs flex items-center justify-center border border-cyan-700/60 mb-2">
              2
            </span>
            <h4 className="font-semibold text-slate-200 text-xs">Generate Gateway API Key</h4>
            <p className="text-[11px] text-slate-400">
              Create a gateway key under <strong className="text-slate-300">API Keys</strong>. Only the SHA-256 hash is persisted.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="w-6 h-6 rounded-full bg-purple-900/50 text-purple-400 font-bold text-xs flex items-center justify-center border border-purple-700/60 mb-2">
              3
            </span>
            <h4 className="font-semibold text-slate-200 text-xs">Point Your Applications</h4>
            <p className="text-[11px] text-slate-400">
              Switch your base URL to <code className="text-cyan-300 font-mono text-[10px]">http://localhost:4000/v1</code>.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Specification */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" className="font-mono">POST</Badge>
            <CardTitle className="font-mono text-sm">/v1/chat/completions</CardTitle>
          </div>
          <CardDescription>
            OpenAI-compatible chat completion endpoint supporting standard JSON and Server-Sent Events (SSE) streaming.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-200 block">Headers:</span>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <div>Content-Type: application/json</div>
              <div>Authorization: Bearer YOUR_TANVELO_API_KEY</div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-200 block">Response Headers:</span>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
              <div><span className="text-cyan-400">X-Tanvelo-Request-Id</span>: req_c82fa0...</div>
              <div><span className="text-cyan-400">X-Tanvelo-Provider</span>: openai (or anthropic / gemini)</div>
              <div><span className="text-cyan-400">X-Tanvelo-Model</span>: gpt-4o</div>
              <div><span className="text-cyan-400">X-RateLimit-Limit</span>: 60</div>
              <div><span className="text-cyan-400">X-RateLimit-Remaining</span>: 59</div>
              <div><span className="text-cyan-400">X-RateLimit-Reset</span>: 45</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-400" /> Integration Code Examples
        </h3>

        {/* cURL */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-cyan-400">cURL Request</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => copyCode(curlSnippet, 1)}>
              {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiedIndex === 1 ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              {curlSnippet}
            </pre>
          </CardContent>
        </Card>

        {/* Python */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-emerald-400">Python (OpenAI SDK)</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => copyCode(pythonSnippet, 2)}>
              {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiedIndex === 2 ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              {pythonSnippet}
            </pre>
          </CardContent>
        </Card>

        {/* Node.js */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-purple-400">Node.js / TypeScript (Streaming)</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => copyCode(nodeSnippet, 3)}>
              {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiedIndex === 3 ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              {nodeSnippet}
            </pre>
          </CardContent>
        </Card>

        {/* Webhooks Verification */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-amber-400">Webhook Signature Verification (Node.js)</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => copyCode(webhookSnippet, 4)}>
              {copiedIndex === 4 ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiedIndex === 4 ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              {webhookSnippet}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
