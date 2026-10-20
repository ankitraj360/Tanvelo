# Tanvelo — Minimal 3D Production Landing Page

A minimal, award-caliber, psychology-driven 3D landing page for **Tanvelo**, a production LLM API gateway.

---

## ⚡ Quick Start / Preview

You can preview the landing page instantly using any static server or dev server:

### Option 1: Python HTTP Server (Zero Dependencies)
```bash
cd landing
python3 -m http.server 3000
```
Then open `http://localhost:3000` in your browser.

### Option 2: Node / npx serve
```bash
cd landing
npx serve .
```

### Option 3: Vite Dev Server
```bash
cd landing
npm install # or pnpm install
npm run dev
```

---

## 🧠 Psychology Architecture — Trust & Attraction

Developers and technical CTOs are discerning and instinctively distrust hype, fake logos, and generic AI graphics. Every section of this landing page is built on specific cognitive psychology principles:

| Section | Psychological Principle | Implementation |
|---|---|---|
| **Hero** | **Primacy & Cognitive Fluency** | The 10-second test passes immediately: concise 3-line headline with signature cyan punctuation, clear single value proposition, and instant reassurance chip (`OpenAI-compatible · Streaming SSE · No SDK rewrite`). |
| **3D Convergence Gate** | **Von Restorff / Isolation Effect** | One cinematic, tactile 3D brand moment draws focus on a quiet, matte obsidian canvas. |
| **Provider Strip** | **Authority & Social Proof** | Factual proof: supported models (OpenAI, Anthropic, Gemini) and OpenAI SDK compatibility instead of unverifiable fake customer badges. |
| **The Problem (01)** | **Loss Aversion & Anchoring** | Directly contrasts provider sprawl (silent 429 cascades, 3 divergent SDKs, uncapped spend) against Tanvelo's unified, deterministic control plane. |
| **Gateway Feature Bento (02)** | **IKEA Effect & Cognitive Clarity** | Interactive Route Simulator lets visitors click failure triggers (`429 Rate Limit`, `Timeout 20s`, `5xx Outage`) to see real deterministic failover in action. |
| **Quickstart (03)** | **Goal Gradient & Reciprocity** | 3-step numbered progression with 1-click copyable code tabs (Python, TypeScript, cURL) and zero email/signup barrier. |
| **Telemetry (04)** | **Radical Transparency & Zeigarnik** | Real request inspector frame (`req_01HT...`) showing complete attempt waterfall, token accounting, and honest estimated costs. |
| **Trust & Security (05)** | **Technical Authority & Honesty** | Concrete cryptographic mechanisms (SHA-256 random key hashing, AES-256-GCM encryption at rest, HMAC-SHA256 signatures) paired with an explicit **Honesty by Default** pledge. |
| **FAQ (06)** | **Objection Handling & Fluency** | Direct, no-fluff answers addressing real engineering questions with smooth, accessible accordion transitions. |
| **Final CTA** | **Peak-End Rule** | Cinematic close ("Make reliability the default") with clear, low-friction next steps. |

---

## 🎨 3D Key Visual — "The Convergence Gate" (`three-gate.js`)

The 3D key visual is an oversized, physical evolution of the Tanvelo convergence mark:
- **Geometry**: Three chamfered frosted-glass ribbon blades forming a triangular aperture, floating above an obsidian base plinth.
- **Center Spark**: High-intensity cyan core (`#38BDF8` / `#F0F9FF`) with volumetric bloom and a forward collimated light beam.
- **Provider Nodes**: Three orbital nodes (OpenAI, Anthropic, Gemini) orbiting along thin elliptical trajectories with converging particle streams feeding into the core.
- **Physics & Motion**:
  - 8-second idle oscillation (`±2°`)
  - 4-second rhythmic core pulse (1.025 scale)
  - Spring-damped pointer parallax (`±4°`) reacting to cursor coordinates
  - Non-hijacking scroll reactivity (12° rotation and subtle pullback)
- **Performance & Accessibility**:
  - Clamped `devicePixelRatio` at `1.5` for consistent 60 FPS
  - `IntersectionObserver` auto-pauses rendering when canvas leaves viewport to conserve GPU & battery
  - Full `prefers-reduced-motion` detection displaying a static, composed camera frame

---

## 📐 Design Tokens & Palette

- **Background (80%)**: `#05070D` (Obsidian near-black with faint 32px radial dot grid)
- **Elevated Surfaces**: `#0A0F1A` / `#0D1424`
- **Hairline Borders**: `rgba(148, 163, 184, 0.14)`
- **Signature Accent**: Cyan `#38BDF8`, Blue `#2563EB`, Violet `#8B5CF6`
- **Typography**: Inter (Body), Geist/Inter (Display), JetBrains Mono (Technical telemetry & code)
