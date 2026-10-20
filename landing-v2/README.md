# Tanvelo — Landing V2

A second, deliberately quieter direction for the Tanvelo landing page: **warm editorial light, a smoked-glass monolith, and far less copy.**

V1 (`/landing`) is the darker, feature-first direction. V2 is its opposite in composition, not in substance: a gallery-like page built around one cinematic object, one interaction, and one code sample.

---

## Preview

```bash
cd landing-v2
python3 -m http.server 8080
# open http://localhost:8080
```

Or with Vite:

```bash
cd landing-v2
npm install
npm run dev
```

No build step is required for the static version. Three.js is vendored locally, fonts are self-hosted, and the page works as plain HTML/CSS/JS.

---

## The concept

**The Monolith.** A floating slab of smoked glass with a warm seam of light through its centre.

Three provider light trails — OpenAI teal, Anthropic clay, Gemini blue — converge into the seam. A single warm thread leaves from the other side. That is the whole product story: *many models in, one contract out.*

The page is built to be understood in under ten seconds:

1. One endpoint. Every model.
2. One sentence of proof.
3. One primary action.

No fake logos, no invented uptime, no testimonial theatre.

---

## Psychology map

| Section | Principle | What it does |
|---|---|---|
| Hero | **Primacy, cognitive fluency** | Two-line promise, one sentence, one button. The 10-second test passes before the 3D begins. |
| 3D monolith | **Von Restorff (isolation), aesthetic-usability effect** | One expensive-looking object on a quiet page. Craft signals care; the metaphor carries the routing story. |
| Micro proof | **Risk reduction** | "OpenAI SDK compatible · Streaming SSE · No rewrite" removes the three biggest adoption objections. |
| Premise | **Loss aversion, anchoring** | "The model is the easy part" reframes the real problem as production, not procurement. |
| Failover trace | **Agency, concrete proof, loss aversion** | Visitors inject a 429, timeout, or 5xx and watch the request survive. The red line makes the alternative feel costly. |
| Quickstart | **Reciprocity, goal-gradient effect** | A complete, copyable snippet with no email wall. Three numbered steps make completion feel close. |
| Security | **Authority through specificity** | SHA-256, AES-256-GCM, HMAC-SHA256. Mechanisms, not badges. |
| Closing | **Peak-end rule** | The largest type on the page lands on "reliability", followed by one low-friction action. |

The page deliberately avoids fabricated social proof. Trust is built through specificity, restraint, and working interactions.

---

## 3D implementation

`js/prism.js` builds the scene with Three.js r160:

- Rounded extruded glass slabs with a physical material, clearcoat, transmission, and a custom fresnel rim shader.
- A procedural equirectangular environment map for warm/cool reflections.
- Three Catmull-Rom light trails with travelling particles; one outbound beam.
- A breathing emissive seam, soft additive glow sprites, floor ring, and sparse dust.
- Damped pointer parallax, horizontal drag-to-orbit, and a subtle idle float.
- Scroll remains native; the 3D merely reacts to it.

**Performance:** pixel ratio capped at 1.65, render loop paused when the stage is offscreen or the tab is hidden, and geometry/material disposal exposed via the returned handle.

**Accessibility:** the canvas is decorative and hidden from assistive tech; the figure has a full text description. `prefers-reduced-motion` produces a static composition. If WebGL fails, a CSS monolith fallback appears automatically.

---

## Design tokens

| Token | Value |
|---|---|
| Paper | `#F3F0E9` |
| Paper deep | `#ECE7DE` |
| Ink | `#111110` |
| Muted | `#6E6961` |
| Accent | `#E8452A` |
| Dark stage | `#0B0B0B` |
| Display | Inter 500, tight tracking |
| Editorial accent | Instrument Serif italic |
| Technical | JetBrains Mono |
| Shell | `1360px` max, `48px` gutters |

Provider accents: OpenAI `#10A37F`, Anthropic `#D97757`, Gemini `#6C8CFF`.

---

## Structure

```
landing-v2/
├── index.html
├── css/styles.css
├── js/
│   ├── main.js          # reveal, nav, simulator, clipboard
│   └── prism.js         # Three.js key visual
├── js/vendor/           # three.module.js (local, no CDN)
├── assets/
│   ├── fonts/           # self-hosted woff2
│   ├── favicon.svg
│   ├── grain.svg
│   └── og.png           # 1200×630 social preview
└── package.json
```

---

## Interactions to check

- Hero 3D: move the pointer, drag horizontally, scroll past and back.
- Failover: click **429 / 504 / 503** and confirm the trace, provider, timings, note, and `aria-pressed` state update.
- Quickstart: **Copy** should report "Copied" for 1.8 seconds.
- Resize from 1440px to 360px: no horizontal overflow; code block scrolls horizontally.
- Toggle reduced motion: no entrance animations, no idle motion, content remains visible.
- Disable WebGL: the CSS fallback monolith appears.

---

## Honest limits

- The failover trace is explicitly labelled **SIMULATED TRACE**; it demonstrates the policy, not live latency.
- The security claims mirror the mechanisms implemented in the Tanvelo gateway (SHA-256 key hashes, AES-256-GCM provider-key encryption, HMAC-SHA256 webhooks).
- There are no customer logos, testimonials, uptime percentages, or pricing claims.
