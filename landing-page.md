# Tanvelo — Google Stitch Prompt Kit

**Deliverable:** a minimal, award-caliber landing page with one cinematic 3D brand moment, a refined logo, and psychology-driven trust signals.

**Fast path:** Prompt 1 (style tile) → Prompt 2A → 2B → 2C (landing page) → Prompt 4 (logo). Use Prompt 3 for a standalone 3D asset and Prompt 5 for mobile and polish.

**Product:** Tanvelo is a production LLM API gateway. It puts OpenAI, Anthropic, and Google Gemini behind one OpenAI-compatible API with deterministic routing and fallbacks, Redis-backed rate limits, budgets with hard cutoffs, request telemetry, webhooks, and security controls.

**Primary conversion:** a technical visitor clicks **“Read the quickstart”** and understands the product in under 10 seconds.

**Design thesis:** *Engineered calm.* The page should feel like the quiet front door to a command center — dark, precise, generous, and technically credible. One 3D object carries the emotion. Everything else is restrained.

**Contents**
- [0. The 5-second brief](#0-the-5-second-brief)
- [1. Recommended Stitch workflow](#1-recommended-stitch-workflow)
- [2. Prompt 1 — Style tile](#2-prompt-1--style-tile--design-system)
- [3. Prompt 2 — Landing page](#3-prompt-2--landing-page-main-prompt)
- [4. Prompt 3 — 3D key visual](#4-prompt-3--3d-key-visual-and-motion-handoff)
- [5. Prompt 4 — Logo and brand board](#5-prompt-4--logo-and-brand-board)
- [6. Prompt 5 — Mobile and polish](#6-prompt-5--mobile-and-polish-passes)
- [7. Psychology map](#7-psychology-map--why-each-section-exists)
- [8. Microcopy bank](#8-microcopy-bank)
- [9. Inspiration and research](#9-inspiration-and-research-notes)
- [10. Build handoff and QA](#10-build-handoff-and-qa)
- [11. One-sentence direction](#11-the-one-sentence-direction)

---

## 0. The 5-second brief

> Tanvelo is one controlled endpoint for every LLM. Design a dark, minimal, editorial landing page for developers who ship to production. Use one cinematic 3D “gateway” object, exact technical proof, and honest copy. No hype, no fake logos, no invented metrics, no generic AI art. The visitor should feel: *these people understand production.*

---

## 1. Recommended Stitch workflow

Use one Stitch project so the visual language stays consistent.

1. **Prompt 1 — Style tile.** Generate the design system first. Pick the strongest result and keep it as the reference.
2. **Prompt 2 — Landing page (2A + 2B + 2C).** Generate the desktop page using the style tile. This is the main prompt, split into three follow-up messages so Stitch does not truncate it.
3. **Prompt 3 — 3D key visual.** Generate the hero render and motion storyboard as a separate asset board.
4. **Prompt 4 — Logo and brand board.** Generate the identity in a separate design, using the same materials and palette.
5. **Prompt 5 — Mobile and polish.** Generate the mobile frame, then run the refinement prompts.

**Practical notes**

- Stitch produces static UI, not a live WebGL scene. Ask for a high-fidelity 3D *still* and a separate motion handoff.
- Generate desktop first, then mobile. Keep the same project and reference the style tile.
- Prompt 2 is already split into 2A, 2B, and 2C. Paste them in order in the same project; do not restart the design between passes.
- Stitch responds better to focused iterations than one giant request. If the full-page output feels shallow, use 2B and 2C as the copy deck and generate each section separately, then combine.
- Use Stitch’s variant feature for the hero composition and the logo. Pick the strongest direction first, then refine it; do not blend three unrelated variants.
- Replace example data labels with real product screenshots once the page is implemented.
- Keep every claim factual. The prompt deliberately contains no customer logos, testimonials, uptime numbers, or pricing.

---

## 2. Prompt 1 — Style tile / design system

Copy everything inside the block into Stitch as a new design.

````text
Create a single high-fidelity UI style tile / design system board for Tanvelo, a production LLM API gateway for developers.

This is a dark, premium developer-infrastructure brand — not a generic AI startup. The board should feel like the visual foundation for a calm, precise command center: matte obsidian surfaces, hairline borders, editorial typography, generous whitespace, and one cinematic accent.

CANVAS
1600 × 1200 px, dark background #05070D, 64px margins, 12-column grid. Label sections with small JetBrains Mono uppercase captions in #64748B. No lorem ipsum. No stock images.

BRAND
- Name: Tanvelo.
- Wordmark: lowercase “tanvelo” in a geometric sans, weight 600, tracking -0.02em.
- Existing mark DNA: three converging prism ribbons (cyan → blue, violet) around a central gateway spark. Evolve this language; do not draw a generic AI icon.
- Personality: precise, calm, quietly confident, technical, transparent.
- Tagline: “Every model. One gateway. Total control.”

COLOR SYSTEM
Show large swatches with hex values and usage percentages.
- Background: #05070D (dominant, 80%)
- Elevated surface: #0A0F1A
- Surface: #0D1424
- Border: rgba(148,163,184,0.14)
- Border strong: rgba(148,163,184,0.24)
- Text: #F8FAFC
- Text secondary: #A8B3C7
- Text muted: #64748B
- Accent cyan: #38BDF8
- Accent blue: #2563EB
- Accent violet: #8B5CF6 (secondary highlight only)
- Success: #34D399
- Warning: #FBBF24
- Danger: #FB7185

Use no more than 2% accent coverage in the UI. The 3D object may carry more color; the interface stays quiet. No rainbow gradients. One signature gradient only: cyan → blue → violet at 135°, used in the logo and 3D object.

TYPOGRAPHY
Show a full type specimen.
- Display: Geist (fallback Manrope / Inter).
- Body: Inter.
- Mono: JetBrains Mono.
- H1: 84px / 0.95 line-height / -0.045em tracking / weight 600.
- H2: 48px / 1.05 / -0.03em / weight 600.
- H3: 20px / 1.3 / weight 600.
- Body: 17px / 1.65 / weight 400.
- Small: 14px / 1.5.
- Eyebrow: 12px mono, uppercase, 0.16em tracking, #64748B.
- Button: 14px, weight 600.
- Maximum body width: 62ch.

COMPONENTS
Show each in default, hover, and focus-visible states where relevant.
- Primary button: #F8FAFC background, #05070D text, 44px height, 10px radius, 20px horizontal padding. Hover: translateY(-1px), very subtle cyan glow.
- Secondary button: transparent, 1px border rgba(148,163,184,0.24), #F8FAFC text.
- Ghost link: text + arrow, no underline until hover.
- Nav bar: 72px height, translucent #05070D at 72%, 20px backdrop blur, 1px bottom border on scroll.
- Card: #0A0F1A, 1px border rgba(148,163,184,0.14), 20px radius, 32px padding, soft inner top highlight. No heavy drop shadow.
- Badge / chip: 999px radius, 1px border, 12px mono uppercase, muted text.
- Code block: #070B12, 1px border, 14px radius, top bar with filename + copy button, JetBrains Mono 13px/1.7. Syntax: cyan keywords, violet strings, slate comments, white text. No macOS traffic lights.
- Accordion row: 1px divider, 16px title, plus/minus icon, 200ms height transition.
- Input: dark surface, 1px border, 12px radius, cyan focus ring.
- Iconography: Lucide, 1.5px stroke, 20px, no filled icons, no emoji.

3D MATERIAL STUDIES
Show three small rendered studies on dark backgrounds:
1. Smoked frosted glass ribbon with iridescent cyan/violet edge.
2. Anodized titanium / obsidian surface with a soft cyan rim light.
3. A small intense cyan core with a subtle bloom and no starfield.
These materials will be used in one hero object only. No generic glowing sphere, no robot, no brain, no neon city.

MOTION TOKENS
List these as small labeled rows:
- Fast feedback: 160ms, cubic-bezier(0.22, 1, 0.36, 1).
- Section reveal: 600ms, same easing, 12px translate + opacity.
- Hero idle: 8s loop, ±2° rotation.
- Core pulse: 4s loop, scale 1.02.
- Reduced motion: opacity-only, ≤150ms, no parallax.

DO / DON'T STRIP
Do: generous whitespace, one accent, hairline borders, editorial type, one 3D moment.
Don't: neon cyberpunk, glassmorphism on every card, rainbow gradients, fake dashboards, stock photos, glowing brains, floating hexagons, generic AI sparkles, excessive pill shapes.

The board should look like a real design-system handoff page, not a mood board.
````

---

## 3. Prompt 2 — Landing page (main prompt)

This is the prompt to use for the actual page. It is split into three messages: 2A sets the direction, 2B builds the page, and 2C finishes trust and behavior. Paste them in order.

### Prompt 2A — Context, visual direction, tokens, and 3D hero

Copy everything inside the block into Stitch first.

````text
You are a senior product designer and art director. Design a high-fidelity, long-scroll landing page for Tanvelo, a production LLM API gateway. This is a real developer-infrastructure product, not a generic AI startup. Produce a finished visual design, not a wireframe.

GOAL
A technical visitor should understand the product in under 10 seconds and click “Read the quickstart.”
The page must answer four questions immediately:
1. What is it? One gateway for every LLM.
2. Who is it for? Teams shipping LLM features in production.
3. Why care? Deterministic fallback, hard limits, real telemetry, security.
4. What next? Read the quickstart.

AUDIENCE
Developers and AI engineers at seed-to-Series-B startups and platform teams, plus technical CTOs. They know the OpenAI SDK, 429s, token costs, provider outages, and budget surprises. They scan for integration effort, failure behavior, spend control, and security. They distrust hype and generic AI design.

BRAND
- Name: Tanvelo. Wordmark: lowercase “tanvelo” in a geometric sans, weight 600, tracking -0.02em.
- Existing mark DNA: three converging prism ribbons (cyan → blue, violet) around a central gateway spark. Evolve it; do not replace it with a generic AI icon.
- Personality: precise, calm, quietly confident, technical, transparent. Not playful, not corporate, not cyberpunk.
- Voice: short declarative sentences. Concrete nouns and verbs. No emoji. No exclamation marks. No “unleash,” “supercharge,” “revolutionize,” or “AI-powered.”
- Tagline: “Every model. One gateway. Total control.”

VISUAL DIRECTION — “ENGINEERED CALM”
- 80% near-black / navy, 12% slate surfaces and secondary text, 6% white, 2% accent. The 3D object may carry more color; the UI remains quiet.
- One signature accent family: cyan #38BDF8, with blue #2563EB and violet #8B5CF6 used only in the logo, 3D object, and one or two micro-highlights.
- Matte obsidian surfaces, 1px hairline borders, soft inner highlights, 2% film grain, and a very faint dot grid. No heavy glassmorphism on every card.
- Generous whitespace. 12-column grid, 1200px max content width, 80px side margins at 1440px, 24px gutters, 128px section padding on desktop, 64px on mobile.
- Editorial typography: big, tight display type; calm body copy; mono for labels and code.
- 3D is used once cinematically in the hero. Secondary 3D appears only as small glass icons and a quiet vault render; everything else is restrained 2D with subtle depth. If you removed the 3D, the page should still look premium.
- Inspiration: Linear’s precision, Raycast’s tactile product lighting, Lusion’s cinematic 3D craft, Vercel’s monochrome confidence, Clerk’s developer clarity. Synthesize these; do not copy any layout, hue, or brand asset.

DESIGN TOKENS
Colors:
--bg #05070D
--bg-elevated #0A0F1A
--surface #0D1424
--border rgba(148,163,184,0.14)
--border-strong rgba(148,163,184,0.24)
--text #F8FAFC
--text-secondary #A8B3C7
--text-muted #64748B
--accent-cyan #38BDF8
--accent-blue #2563EB
--accent-violet #8B5CF6
--success #34D399
--warning #FBBF24
--danger #FB7185

Typography:
Display: Geist (fallback Manrope / Inter). Body: Inter. Mono: JetBrains Mono.
H1: 84px desktop / 44px mobile, 0.95 line-height, -0.045em tracking, weight 600.
H2: 48px / 34px, 1.05, -0.03em, weight 600.
H3: 20px / 18px, 1.3, weight 600.
Body: 17px / 16px, 1.65, weight 400.
Small: 14px / 13px, 1.5.
Eyebrow: 12px mono, uppercase, 0.16em tracking, #64748B.
Buttons: 14px, weight 600.
Max body width: 62ch.

Spacing and shape:
8px base unit. Section padding 128/96/64. Card padding 32. Gaps 16/24/32.
Cards: 20px radius. Buttons: 10px radius. Code blocks: 14px radius. Chips: 999px.
Borders: 1px hairline. Shadows: soft ambient only; never harsh black drop shadows.
Buttons: primary is #F8FAFC with #05070D text, 44px height, 10px radius, 20px padding. Hover: translateY(-1px) and a very subtle cyan glow. Secondary is transparent with a 1px border. One primary CTA in page content per viewport; the nav CTA is the only exception.
Icons: Lucide, 1.5px stroke, 20px, no filled icons, no emoji.
Code block: #070B12, 1px border, 14px radius, top bar with filename and copy button, JetBrains Mono 13px/1.7. Syntax: cyan keywords, violet strings, slate comments, white text. No macOS traffic lights.

3D HERO — “THE GATE”
Place one cinematic 3D object on the right side of the first viewport, roughly 520–620px square, slightly overlapping the grid.
The object is an oversized, three-dimensional evolution of the Tanvelo mark: three offset, curved glass ribbons forming a rounded triangular aperture, floating above a dark reflective plinth. A small, intense cyan core sits in the negative space. Three smaller provider orbs — OpenAI, Anthropic, Gemini — orbit on thin elliptical paths. Hairline streams of light converge into the core and leave as one clean beam.
Materials: smoked frosted glass (transmission 0.9, roughness 0.15, thickness 1.2, IOR 1.45), anodized titanium edges, iridescent cyan/violet rim, obsidian base (metalness 0.7, roughness 0.35).
Lighting: cool key light from top-left (#BFE9FF), violet rim from back-right (#7C3AED), soft contact shadow, subtle bloom. No neon overload, no starfield, no cyberpunk city, no glowing brain, no robot.
Camera: 35mm, f/2.8, 5° top-down, three-quarter angle. It should feel like a product photograph, not a screensaver.
Motion: 8s idle rotation of ±2°, orbital nodes on a 20s loop, core pulse 4s at 1.02 scale. On pointer move, camera parallax ±4° with spring damping. On scroll, the gate rotates 12° and the camera pulls back slightly. No scroll hijacking.
Overlay: one small glass chip near the object, reading “EXAMPLE ROUTE” in 10px mono, then “gpt-4o → claude-3-5-sonnet → gemini-2.0-flash,” with a tiny green “fallback ready” dot. Keep it subtle.
Mobile and reduced motion: use a static high-resolution render, no orbit, no parallax. Keep the same composition.
If the tool cannot render 3D: create a high-fidelity rendered still as the hero image and include a separate handoff frame with the motion notes. Do not substitute a generic glowing sphere.
````

---

### Prompt 2B — Page structure and exact copy

Paste this as a follow-up in the same Stitch project. Keep the style tile, tokens, and 3D direction from Prompt 2A. Do not restart the visual language.

````text
Continue the Tanvelo landing page. Use the same dark “engineered calm” system, typography, spacing, and 3D hero direction. Now build the full page structure with the exact copy below. Do not rewrite the headlines without a reason.

FORMAT
Desktop 1440px wide, long scroll, dark mode only. High-fidelity UI, not a wireframe. Real copy, not lorem ipsum. Maximum 9 content sections plus nav and footer. One primary CTA in page content per viewport; the nav CTA is the only exception. No carousel, no auto-playing video, no cookie banner, no chat widget.

GLOBAL LAYOUT
12-column grid. 1200px max content width. 80px side margins at 1440px. 24px gutters. 128px section padding on desktop. Left-aligned editorial rhythm. Use a small mono section label above each H2, e.g. “01 / THE PROBLEM” with the slash in cyan.
Optional signature detail: a 1px vertical “route line” in the left margin, with tiny nodes at each section label and a cyan scroll-progress dot. Keep it extremely subtle; hide it on mobile.

1. NAVIGATION
- Sticky, 72px height, background rgba(5,7,13,0.72), 20px backdrop blur, 1px bottom border rgba(148,163,184,0.14) after scroll.
- Left: the Tanvelo mark + wordmark “tanvelo” at 20px, weight 600, tracking -0.02em.
- Links: Product, How it works, Security, Docs. 14px, #A8B3C7, hover #F8FAFC.
- Right: a small GitHub icon link (optional) and a primary “Start building” button at 36px height, linking to /docs.
- On scroll: shrink to 64px and reveal the bottom border.
- Mobile: mark + menu button. Full-screen sheet with large links and a full-width CTA. 44px minimum targets.

2. HERO
Layout: two columns. Text spans columns 1–6, the 3D gate spans columns 7–12 and may extend 64px past the grid on the right. Top padding 112px. Minimum height 760px on desktop.
- Eyebrow: small cyan pulse dot + “PRODUCTION LLM GATEWAY” + “v1.0” in 11px mono, muted.
- H1, three lines, 84px, weight 600, tracking -0.045em:
  “Every model.”
  “One gateway.”
  “Total control.”
  Render every period in cyan #38BDF8; all other letters in #F8FAFC. No gradient text.
- Subhead, max 52ch, 17px, #A8B3C7:
  “Tanvelo routes OpenAI, Anthropic, and Gemini through one OpenAI-compatible API — with deterministic fallbacks, hard limits, and telemetry you can defend.”
- CTA row: primary “Read the quickstart” with a right arrow; secondary “See how it routes” with a down arrow. 12px gap.
- Microcopy under the CTAs, 11px mono, muted, separated by middle dots:
  “OpenAI-compatible · Streaming SSE · No SDK rewrite”
- 3D visual: the Gate described in Prompt 2A. One small glass chip at its lower-left: “EXAMPLE ROUTE” / “gpt-4o → claude-3-5-sonnet → gemini-2.0-flash” with a tiny green “fallback ready” dot.
- Bottom of hero: a 1px hairline rule and a centered 10px mono label “SCROLL TO INSPECT.”
- No hero carousel, no video background, no particle explosion, no floating badges everywhere.

3. PROVIDER STRIP
A full-width strip with 1px top and bottom borders, 72px height, background #070B12.
- Left label, 10px mono, uppercase, muted: “ONE API. THREE PROVIDERS.”
- Center: “OpenAI”, “Anthropic”, “Google Gemini” as clean text wordmarks at 16px, #A8B3C7. On hover, they become #F8FAFC. Do not use customer-logo language.
- Right: a small chip “OpenAI SDK compatible.”
- No “trusted by” language. These are supported providers, not customers.

4. PROBLEM / BEFORE-AFTER
Section label: “01 / THE PROBLEM”
H2: “Provider sprawl is a reliability problem.”
Subhead: “Three SDKs. Three key formats. Three failure modes. One invoice you can't explain. Every provider you add makes production harder to reason about.”
Visual: a two-column comparison with a thin divider.
- Left, labeled “WITHOUT TANVELO”: three stacked provider tiles connected by tangled dashed lines. Small labels: “keys,” “schemas,” “429s,” “logs,” “invoices.” Muted gray and desaturated red. Flat, slightly messy.
- Right, labeled “WITH TANVELO”: one central gateway tile with three clean cyan lines to the provider nodes. Small labels: “one key,” “one schema,” “one log stream,” “one budget.” Subtle depth and a soft cyan glow.
- Divider: a thin vertical line with a small arrow pointing left to right.
Bottom line: “Less glue code. Fewer blind spots.” with a text link “See the architecture →”.
This is a conceptual diagram, not a data visualization. No fake numbers.

5. FEATURE BENTO
Section label: “02 / THE GATEWAY”
H2: “Production controls, not a proxy.”
Subhead: “Tanvelo is the control plane between your app and every model. Route, limit, observe, and secure — without rebuilding your stack.”
Grid: 12 columns, 2 rows, 24px gap.
- Card A, 6 columns wide × 2 rows tall: “Route with intent.”
  Copy: “Set a primary provider, ordered fallbacks, retries, and timeouts per project. Tanvelo follows your rules — never a black box.”
  Visual: a clean route diagram. OpenAI as primary, Anthropic as fallback, Gemini as standby. A small segmented control “429 / timeout / 5xx” with “429” selected. The active path is cyan; inactive paths are faint. Label “EXAMPLE POLICY.” Text link “Explore routing →”.
- Card B, 3 columns: “Drop-in compatible.”
  Copy: “Keep your OpenAI SDK. Change the base URL and key.”
  Visual: a two-line code diff with `base_url="https://api.tanvelo.com/v1"` and a copy button.
- Card C, 3 columns: “Limits that hold.”
  Copy: “Redis-backed, atomic limits per key and project. Standard X-RateLimit headers. Honest 429s.”
  Visual: a minimal gauge plus three small header chips: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- Card D, 3 columns: “Spend without surprises.”
  Copy: “Budgets with warning thresholds and hard cutoffs where enforcement is reliable.”
  Visual: a budget ring at 72%, a warning marker, and a tiny “EXAMPLE” label. No dollar figure that looks like a real bill.
- Card E, 3 columns: “Every attempt, recorded.”
  Copy: “See the exact provider sequence, timing, tokens, and estimated cost for each request.”
  Visual: a mini waterfall timeline: “OpenAI 429” → “Anthropic 200” → “Gemini standby.” Label “EXAMPLE.”
Card style: #0A0F1A, 1px border, 20px radius, 32px padding, inner top highlight. On hover: border brightens to rgba(56,189,248,0.28), a 6% cyan spotlight follows the cursor, and the 3D glass icon lifts 2px. Do not use heavy drop shadows.
Icons: 40px glass tile with a 20px Lucide line icon. Routing = GitBranch, compatibility = Code2, limits = Gauge, budgets = Wallet, telemetry = Activity. Use ShieldCheck for the trust section.
Under the grid, small 12px muted note with a check icon: “Real data only. If there's no data, you'll see an empty state — not a fake chart.”

6. HOW IT WORKS / QUICKSTART
Section label: “03 / QUICKSTART”
H2: “From zero to first request in one sitting.”
Subhead: “If you can call OpenAI, you can call Tanvelo. No new SDK. No rewrite. No mystery.”
Layout: three steps in a row on desktop, connected by a 1px line with numbered nodes. Vertical on mobile.
Step 1: “Point your SDK at one endpoint.”
Code panel with tabs “Python / TypeScript / cURL”; active Python. Filename “quickstart.py”; copy button. Use this exact code:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.tanvelo.com/v1",
    api_key="YOUR_TANVELO_API_KEY",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Ship it."}],
    stream=True,
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

Step 2: “Set the route.”
A compact route policy card, label “EXAMPLE POLICY”:

```text
Primary      OpenAI · gpt-4o
Fallback 1   Anthropic · claude-3-5-sonnet-20241022
Fallback 2   Gemini · gemini-2.0-flash
Timeout      20s
Retries      2
```

Add a small toggle row for “429 / timeout / 5xx” to show that the fallback path is deterministic.
Step 3: “Ship and inspect.”
A mini response card, label “EXAMPLE”:

```text
200 OK        1.24s
842 tokens    $0.0042 est.
Route: OpenAI → success
```

Add a text link “VIEW REQUEST →”.
Bottom microcopy: “Your existing OpenAI SDK works. Your existing code stays.” Text link: “Copy the quickstart →”.
No email gate. No signup wall.
````

---

### Prompt 2C — Trust, FAQ, close, behavior, and guardrails

Paste this as a follow-up in the same Stitch project. Keep the same page and visual system.

````text
Continue the Tanvelo landing page. Finish the remaining sections, then apply the psychology, motion, responsive, accessibility, and constraint rules below. Do not add sections that are not specified.

7. TELEMETRY / PRODUCT PROOF
Section label: “04 / TELEMETRY”
H2: “Every request has a paper trail.”
Subhead: “Not a pretty chart with invented numbers. A request inspector that shows what actually happened — provider attempts, timing, tokens, and estimated cost.”
Visual: a large product UI frame with a slight perspective (rotateX 1.5°, rotateY -3°) that straightens on scroll. 1px border, 24px radius, soft cyan ambient glow. It should look like a real screenshot of the Tanvelo dashboard, not a generic analytics mock.
Inside the frame:
- Top bar: “Request · req_01HT…” + green “200 OK” chip + “Production” chip.
- Left column: metadata rows for Project, Environment, Key prefix, Model, Started, Duration.
- Center: a provider-attempt timeline. Show “OpenAI · gpt-4o · 429 · 0.18s” then an arrow and “Anthropic · claude-3-5-sonnet · 200 · 1.06s,” with “Gemini · standby.” Label the whole panel “EXAMPLE REQUEST.”
- Right column: a latency waterfall, token counts “Input 612 · Output 230,” estimated cost “$0.0042,” and a tiny “ESTIMATE” label.
- Three thin annotation lines point to “Provider attempts,” “Timing breakdown,” and “Token + cost accounting.”
Below the frame, small muted text: “Example request shown. Production views use persisted records only.”
CTA: “Inspect the dashboard →”. If the dashboard is not publicly reachable, use “Read the request-inspector docs →” instead.

8. TRUST / SECURITY / HONESTY
Section label: “05 / TRUST”
H2: “Guardrails you can inspect.”
Subhead: “Security isn't a badge at the bottom of the page. It's a set of controls you can verify in the docs.”
Two-column layout. Left: a 1:1 3D “vault gate” render using the same three-ribbon glass language, layered like a secure aperture, with a cyan core and obsidian base. Right: four trust rows separated by 1px dividers. Each row has a small line icon, a 16px title, and 14px body copy:
1. “Gateway keys” — “Cryptographically random, shown once, stored as SHA-256 hashes.”
2. “Provider credentials” — “Encrypted at rest with AES-256-GCM. Never exposed to the browser.”
3. “Webhooks” — “HMAC-SHA256 signatures, bounded retries, SSRF protection.”
4. “Request data” — “Sanitized by default, secrets redacted, retention bounded.”
Hover: a 2px cyan left border appears; no layout shift.
Below the two columns, a full-width honesty strip with a 2px cyan left border and a slightly elevated background:
Label: “HONESTY BY DEFAULT”
Statement: “No invented uptime. No fake customer logos. No mock charts pretending to be production. If we haven't earned a claim, we don't make it.”
CTA: “Read the security model →”.
Do not show SOC 2, ISO, GDPR, or other certification badges unless they are explicitly supplied. No “bank-grade” or “military-grade” language.

9. FAQ
Section label: “06 / QUESTIONS”
H2: “The questions engineers actually ask.”
Subhead: “Straight answers. No sales fog.”
Two-column layout. Left: the heading, subhead, and a small card “Still curious? Read the docs →”. Right: a five-item accordion, first item open. 1px dividers, plus/minus icon, 200ms height transition, keyboard operable.
1. “Is Tanvelo a proxy or a gateway?”
   “It's a control plane and gateway. One endpoint, explicit routing rules, rate limits, budgets, and an inspectable request log.”
2. “Do I have to rewrite my app?”
   “No. Point an OpenAI-compatible SDK at the Tanvelo base URL and use a gateway key. Supported parameters and known differences are documented.”
3. “What happens when a provider fails?”
   “Eligible failures — rate limits, timeouts, and upstream 5xx errors — trigger the fallback order you configured. Every attempt is recorded.”
4. “Can I enforce a hard budget?”
   “Yes, where enforcement is reliable. In-flight requests and provider-side billing can create small discrepancies; the dashboard labels estimates clearly.”
5. “Do you store my prompts?”
   “Request and response bodies are sanitized by default, sensitive content is redacted, and retention is bounded. Body storage is opt-in, not the default.”

10. FINAL CTA
Full-width closing section, 160px vertical padding, centered.
Background: the 3D gate opens. Two ribbon halves part slightly and a soft cyan light beam escapes. Maximum 24 dust motes, a gentle vignette, no starfield.
Eyebrow: “ONE ENDPOINT. EVERY MODEL.”
H2: “Make reliability the default.”
Subhead: “Put every model behind one controlled endpoint.”
CTA row: primary “Read the quickstart”; secondary “Open the dashboard” only if the dashboard is reachable in this deployment; otherwise “See how it routes.”
Microcopy: “OpenAI-compatible · Streaming SSE · No SDK rewrite”
At the bottom, a giant “tanvelo” wordmark at 12vw, 4% opacity, cropped by the section edge. It is a texture, not a headline.

11. FOOTER
Four columns plus a bottom bar.
- Left: the mark + “tanvelo,” the line “Built for production, not demos,” and a mono tech strip: “Fastify · PostgreSQL · Redis · Next.js.”
- Product: Features, How it works, Security, Docs.
- Providers: OpenAI, Anthropic, Google Gemini.
- Resources: Quickstart, API reference, Status, GitHub.
- Company: About, Contact, Privacy, Terms.
- Bottom bar: “© 2026 Tanvelo.” + “Gateway v1.0” + “Status →”. Do not show “All systems operational” unless it reflects a real status feed.
No newsletter form in v1. No social icons unless they are real.

PSYCHOLOGY — APPLY, DO NOT ANNOUNCE
- Primacy: the H1, subhead, and primary CTA must be visible above the fold at 1440×900 and 390×844.
- Cognitive fluency: one idea per section, short sentences, 62ch maximum body width, consistent components.
- Aesthetic-usability: premium 3D and precise spacing signal competence; keep the page fast.
- Von Restorff / isolation: one bright 3D object and one primary CTA in page content per viewport (the nav CTA is the exception); everything else quiet.
- Loss aversion: name the real costs of provider sprawl — silent failures, runaway spend, unreadable logs — then show the control. No fear-mongering.
- Anchoring: the before/after comparison makes one gateway feel simpler than three integrations.
- Authority: use exact mechanisms (SHA-256, AES-256-GCM, HMAC-SHA256, Redis atomic, X-RateLimit headers), code, and docs links.
- Social proof: supported providers and OpenAI SDK compatibility are the only proof in v1. No fake logos, testimonials, ratings, or customer counts.
- Reciprocity: open docs, copyable snippets, no email gate.
- Zeigarnik: the interactive route/fallback demo creates a small open loop; the FAQ resolves objections.
- Goal gradient: the three-step quickstart with numbered progress makes the first request feel close.
- Hick's law: maximum 4 nav links, one primary CTA in page content per viewport (the nav CTA is the exception), five feature cards.
- Fitts's law: 44px+ targets, full-width mobile CTA, sticky bottom CTA after the hero.
- Peak-end: cinematic hero and a confident final CTA; the footer stays clean.
- Commitment/consistency: “Copy quickstart → Read docs → Open dashboard” is a low-friction sequence.
- Honesty: no fake urgency, scarcity, countdowns, or testimonials. Transparency is the trust strategy.

MOTION
- Page load: 600ms fade/translate for hero copy, 60ms stagger; 3D poster blur-up. Never block content on the 3D asset.
- Scroll: sections reveal 12px + opacity over 600ms, cubic-bezier(0.22, 1, 0.36, 1), 60ms stagger. No scroll-jacking.
- Hero 3D: ±2° idle rotation over 8s; 20s orbit; 4s core pulse at 1.02 scale; pointer parallax ±4°; scroll rotation 12°.
- Nav: 200ms height/border transition; active link underline.
- Buttons: 160ms translateY(-1px); subtle cyan glow; magnetic effect maximum 6px on desktop only.
- Cards: 6% cursor spotlight, border brightens, icon lifts 2px.
- Code copy: icon morphs to a check and the label becomes “Copied” for 1.5s.
- Accordion: 200ms height/opacity.
- Reduced motion: disable parallax, idle rotation, scroll pinning, and magnetic movement; show the static poster; keep opacity transitions ≤150ms.
- No autoplay video, no sound, no custom cursor, no page transition that delays content.

RESPONSIVE
- Desktop 1440, tablet 768, mobile 390.
- Hero stacks text first, 3D second on mobile. 3D height 320px. H1 44px. CTAs full width. Sticky bottom CTA appears after the hero, 56px plus safe-area inset.
- Bento becomes one column; the large routing card comes first; cards min-height 220px. No content is hover-only.
- Steps become vertical with a line on the left. Code blocks scroll horizontally with a visible fade affordance.
- Dashboard preview crops to the most important panel on mobile; allow horizontal exploration with a small “drag to explore” hint only if necessary.
- Nav becomes a full-screen sheet; 44px targets.
- Section padding 64px. Body 16px. No text below 12px.
- Logo icon + wordmark at 24px; the favicon must remain legible at 16px.

ACCESSIBILITY
- WCAG AA contrast. #A8B3C7 on #05070D is safe for body; #64748B only for non-essential labels.
- Focus-visible: 2px cyan ring, 3px offset. Never remove outlines.
- Semantic h1 → h2 → h3, landmarks, and a skip link.
- Alt text for the 3D hero: “Abstract 3D gateway mark: three translucent ribbons orbit a glowing cyan core.”
- Accordion keyboard operable with aria-expanded. Copy button announces “Copied.”
- Reduced motion respected. No color-only status; pair dots with labels.
- 44×44px targets. No autoplay audio or video.

CONSTRAINTS
- High-fidelity UI, not a wireframe. Real copy, not lorem ipsum.
- No pricing section: pricing is not defined.
- No signup, login, or dashboard-auth UI: those are out of scope.
- No customer logos, testimonials, ratings, or “trusted by” claims: none are verified.
- No invented metrics: no “99.99% uptime,” “10x faster,” request counts, or customer counts.
- No “AI-powered” language. Tanvelo's routing is deterministic.
- No generic AI tropes: glowing brain, robot, chip, cloud, neural network, floating hexagons, purple mesh gradient, particle explosion, sparkle icon, “unleash,” “supercharge,” “revolutionize.”
- No stock photography or AI-generated faces.
- No carousel, marquee, autoplay video, cookie banner, or chat widget.
- No fake urgency, scarcity, countdowns, or dark patterns.
- No more than two fonts plus one mono. No more than one accent family.
- No glassmorphism on every card; no neon outlines everywhere.
- No 3D text; the wordmark stays flat and crisp.
- Label every example data point “EXAMPLE” in small mono text.
- Use “OpenAI-compatible,” not “100% compatible.” Use “estimated cost,” not “bill.” Use “deterministic,” not “AI decides.”
- Do not claim features that are not in this brief.

DELIVERABLES
1. One desktop landing page frame, 1440px wide, long scroll.
2. One mobile frame, 390px wide.
3. A separate handoff frame with the 3D hero breakdown, motion timings, and responsive behavior.
4. Optional: a compact hover/focus state strip.
5. Notes on where real product screenshots or assets should replace illustrative panels.

If the tool cannot generate the full long page in one pass, generate the hero and first four sections first, then continue with the same visual system. Do not change the design language between passes.
````

---

## 4. Prompt 3 — 3D key visual and motion handoff

Use this when you want a dedicated hero asset rather than relying on the landing-page generator.

````text
Create a standalone 3D key visual for Tanvelo, a production LLM API gateway. This is the hero artwork and the three-dimensional evolution of the brand mark. It must feel like a real product photograph, not a generic AI illustration.

SUBJECT — “THE GATE”
Three offset, curved glass ribbons form a rounded triangular aperture, floating above a dark reflective plinth. A small, intense cyan core sits in the triangular negative space. Three smaller matte-glass orbs orbit on thin elliptical paths. Hairline streams of light converge from the orbs into the core and leave as one clean beam.

MEANING
Three providers. One controlled path. The ribbons are independent but converge; the core is the gateway; the single beam is the unified API.

GEOMETRY
- Three ribbons, each a thick chamfered arc segment, arranged around a centered triangular void.
- The ribbons do not touch. Leave three thin slits that suggest flow and rotation.
- 45° and 90° chamfers, 2px rounded edges at the final render scale.
- The silhouette reads as a rounded gate or aperture, not a letter, not a circle, not a generic hexagon.
- The core is a 6–8% diameter sphere relative to the object, intensely cyan, with a soft bloom.

MATERIALS
- Smoked frosted glass: transmission 0.9, roughness 0.15, thickness 1.2, IOR 1.45.
- Anodized titanium edge highlights.
- Iridescent thin-film rim in cyan #38BDF8 → blue #2563EB → violet #8B5CF6 at 135°.
- Obsidian plinth: metalness 0.7, roughness 0.35, subtle reflection.
- No chrome mirror, no rainbow oil slick, no transparent plastic.

LIGHTING
- Cool key light from top-left, #BFE9FF, large softbox.
- Violet rim light from back-right, #7C3AED, low intensity.
- Soft contact shadow under the plinth.
- Subtle volumetric glow around the core only. No starfield, no nebula, no lens flare, no cyberpunk city.

CAMERA
35mm, f/2.8, 5° top-down, three-quarter angle. Shallow depth of field with the core and front ribbon sharp. The object occupies 70% of the frame. Plenty of negative space for the headline on the left.

BACKGROUND
Deep navy #05070D with a faint radial glow and 2% film grain. Transparent PNG/WebP version also required for compositing.

OUTPUT
- 1:1 square render, 4096 × 4096.
- 4:5 portrait crop.
- 16:9 hero crop with the object on the right third.
- A transparent-background version.
- A low-weight poster version for mobile.

MOTION STORYBOARD
Create a three-frame strip beside the render:
1. IDLE — 8s loop, ±2° rotation, core pulse 4s at 1.02 scale.
2. POINTER — camera parallax ±4°, spring damping, orbits shift slightly.
3. SCROLL — gate rotates 12°, camera pulls back 8%, the single beam brightens.
Annotate: “No scroll hijacking. Reduced-motion version = static poster.”
````

---

## 5. Prompt 4 — Logo and brand board

Use this in a separate Stitch design. It should feel like the same brand as the landing page, not a separate concept.

````text
You are a senior brand identity designer. Create a logo and a brand presentation board for Tanvelo, a production LLM API gateway. The identity must feel precise, calm, technical, and premium — the visual equivalent of “engineered calm.”

BRAND IDEA
Tanvelo is the convergence point for every LLM. Three independent provider streams become one controlled path. The mark should express convergence, routing, and a gateway — without literal letters, brains, chips, clouds, robots, or generic AI sparkles.
This is a refined evolution of the existing kinetic chevron emblem: keep the three asymmetric prism blades and the central spark, but resolve them into a balanced, recognizable gate. Present the primary identity as clean flat vector-style artwork; the 3D render is an additional brand asset.

THE MARK — “THE CONVERGENCE GATE”
Build the mark on a 100 × 100 grid.
- Three thick, chamfered ribbon blades form a rounded triangular aperture.
- The blades do not touch. Three thin slits between them suggest flow and rotation.
- Each blade has 45° and 90° cuts and 2px rounded corners at 100px scale.
- The central negative space is a soft triangle. A small cyan spark sits at its exact center.
- The silhouette reads as a gate or aperture, not a circle, not a hexagon, not a letter T.
- The three blades represent OpenAI, Anthropic, and Gemini converging into one gateway.
- The mark must work at 16px. For the favicon, simplify: remove the smallest slit and enlarge the core to 3px.

CONSTRUCTION
- Start with a 100 × 100 artboard and an 8px grid.
- Outer silhouette approximately 76 × 76, centered.
- Three blades arranged at 120° intervals, each offset radially by 2px to create depth.
- Central aperture approximately 18 × 18.
- Core diameter 6–8, centered.
- Keep stroke-free, flat fills for the vector version. No outlines.
- The negative space must be readable in one color.

WORDMARK
- Lowercase “tanvelo.”
- Geometric grotesk, weight 600, tracking -0.02em.
- The “v” has a single 45° cut on its left terminal to echo the blades.
- The “o” is a perfect circle, subtly echoing the aperture.
- Do not over-style the other letters.
- Descriptor (large lockups only): “LLM GATEWAY” in JetBrains Mono, 10px, uppercase, tracking 0.18em, muted #64748B.
- Wordmark stays flat. No bevel, no gradient, no 3D.

COLOR
- Primary mark gradient: cyan #38BDF8 → blue #2563EB → violet #8B5CF6 at 135°.
- Core: #E0F2FE with a cyan glow in the 3D version.
- On dark: gradient blades + light core.
- On light: solid ink #0B0F19 blades + cyan core.
- Monochrome: all white or all black, with the core knocked out as negative space. The mark must work when the core is a hole.
- Never use more than three brand colors plus the core highlight.

3D VERSION
- Extrude the three blades 20px with a 2px bevel.
- Smoked frosted glass (transmission 0.85, roughness 0.18), anodized titanium edges, iridescent cyan/violet rim.
- Floating above an obsidian plinth with a soft contact shadow.
- Cyan core with a subtle bloom, cool key light top-left, violet rim back-right.
- Transparent background, 4096 × 4096 PNG/WebP.
- This render must match the hero object on the landing page: same geometry, materials, and lighting.

LOCKUPS
1. Horizontal: icon left, wordmark right, gap equal to one-third of the icon width.
2. Stacked: icon above, wordmark below, centered.
3. Icon-only: app icon and favicon.
4. Monochrome horizontal and stacked.
5. App icon: #05070D rounded square, 22% padding, mark centered, 1px inner border rgba(255,255,255,0.08). No wordmark.

CLEAR SPACE AND MINIMUM SIZE
- Clear space: half the icon height on all sides.
- Minimum horizontal lockup width: 96px.
- Minimum icon size: 16px.
- At 16px, the mark must read as a single strong silhouette, not a blur.

BRAND BOARD LAYOUT
1600 × 1200 px, #05070D background, 64px margins, 12-column grid.
- Top left: primary horizontal lockup at 320px wide.
- Top right: 3D render at 480 × 480.
- Row 2: icon-only at 96px; stacked lockup; monochrome versions; favicon strip at 16 / 32 / 48 / 64.
- Row 3: color palette with five swatches and hex values; type specimen with “Aa,” alphabet, and mono sample.
- Row 4: clear-space diagram; three “don't” examples with a red X; three usage examples (nav, app icon, hero).
- Add a short rationale in the corner: “Three streams. One gate.”
Use small mono labels for every section. The board should look like real brand guidelines, not a mood board.

DON'TS
No literal “T,” brain, chip, cloud, robot, sparkle, lightning bolt, infinity symbol, hexagon, shield, rocket, or generic gradient orb.
No more than three brand colors plus the core highlight. No thin strokes below 2px at 100px. No text inside the mark. No drop shadows on the flat logo. No 3D bevel on the wordmark. No stock icon.

DELIVERABLES
Primary horizontal lockup, stacked lockup, icon-only mark, monochrome versions, favicon set, app icon, 3D render, brand board, and a one-paragraph usage rationale.
````

---

## 6. Prompt 5 — Mobile and polish passes

Use these as short follow-up messages after the desktop page is generated.

**Mobile pass**

````text
Create a mobile version of the Tanvelo landing page at 390px wide. Keep the same visual system and copy. Stack the hero: eyebrow, H1 at 44px, subhead, full-width primary CTA, secondary CTA, microcopy, then the 3D poster at 320px height. Add a 56px sticky bottom CTA after the hero. Make the bento single-column with the routing card first. Turn the steps vertical with a line on the left. Make code blocks horizontally scrollable with a fade affordance. Collapse the nav into a full-screen sheet with 44px targets. Reduce section padding to 64px and body text to 16px. No hover-only content. Keep the page under 8,000px tall if possible.
````

**Minimalism pass**

````text
Make the page more minimal without losing hierarchy. Remove the third accent color from the UI (keep it only in the logo and 3D). Reduce the number of visible borders by 30%. Increase section padding by 24px. Remove any glow that is not attached to the 3D object or the primary CTA. Remove decorative chips that do not carry real information. Keep one primary CTA in page content per viewport (the nav CTA is the exception). If a section feels busy, delete the least important element rather than shrinking it.
````

**Trust pass**

````text
Audit the page for trust. Remove or relabel any invented metric, customer logo, testimonial, certification badge, or “trusted by” claim. Every example data point must carry an “EXAMPLE” label. Replace vague security language with exact mechanisms. Make sure the honesty strip is present. Make sure the primary CTA leads to the quickstart, and the secondary CTA does not point to a publicly exposed management dashboard. Add the line “Real data only. Empty states, not fake charts.” under the feature grid.
````

**Typography and spacing pass**

````text
Tighten the typography. H1 should be 84px desktop / 44px mobile with -0.045em tracking and 0.95 line-height. H2 should be 48px desktop / 34px mobile with -0.03em tracking. Body should be 17px / 1.65. Use no more than three weights. Align every section to the 8px spacing system. Make sure the hero headline breaks into exactly three lines on desktop. Increase contrast for secondary text if it falls below WCAG AA. Remove any text smaller than 12px except mono labels.
````

**3D integration pass**

````text
Place the 3D gate render from the key visual into the hero. It should occupy the right half, slightly overlap the grid, and sit on a dark reflective surface. Add a subtle cyan ambient glow behind it and a soft contact shadow. Keep the left side of the hero empty enough for the headline. On mobile, replace the 3D scene with the static poster. Do not add extra 3D objects to other sections; use only the small glass icons in the feature cards and the vault render in the trust section.
````

---

## 7. Psychology map — why each section exists

Use this as a design review checklist. Do not put these labels in the UI.

| Section | Primary principle | What it does |
|---|---|---|
| Hero | Primacy, cognitive fluency, Von Restorff | Three-line promise, one 3D object, one CTA. The visitor understands the product before scrolling. |
| Provider strip | Authority, social validation | Supported providers and OpenAI SDK compatibility are factual proof, not fake customer logos. |
| Problem / before-after | Loss aversion, anchoring | Names the real cost of provider sprawl, then anchors the single gateway as the simpler path. |
| Feature bento | Cognitive load, IKEA effect | Five scannable controls; the interactive route builder lets visitors configure “their” route. |
| Quickstart | Goal gradient, reciprocity, commitment | Three numbered steps, copyable code, no email gate. The first request feels close. |
| Telemetry | Authority, trust, Zeigarnik | A real request inspector with labeled example data; details reward curiosity. |
| Trust / security | Authority, loss aversion, honesty | Exact mechanisms instead of badges; the honesty strip differentiates the brand. |
| FAQ | Objection handling, cognitive fluency | Direct answers to integration, failure, budget, and privacy concerns. |
| Final CTA | Peak-end, commitment | A cinematic close and one low-friction next step. |
| Footer | Closure, credibility | Clean navigation, real status link, no clutter. |

**Trust equation (adapted from David Maister):** credibility (specific mechanisms) + reliability (deterministic behavior) + intimacy (developer empathy, honest limits) ÷ self-orientation (no hype, no fake proof, docs first).

**Avoid:** false scarcity, fake countdowns, invented testimonials, dark patterns, “book a demo” when no demo exists, and urgency that a developer would immediately distrust.

---

## 8. Microcopy bank

**Primary CTA**
- Read the quickstart
- Start building

**Secondary CTA**
- See how it routes
- Inspect the dashboard
- Read the security model

**Hero microcopy**
- OpenAI-compatible · Streaming SSE · No SDK rewrite
- One endpoint · Three providers · Zero guesswork

**Section labels**
- 01 / THE PROBLEM
- 02 / THE GATEWAY
- 03 / QUICKSTART
- 04 / TELEMETRY
- 05 / TRUST
- 06 / QUESTIONS

**Example labels**
- EXAMPLE ROUTE
- EXAMPLE POLICY
- EXAMPLE REQUEST
- ESTIMATE

**Honesty lines**
- Real data only. Empty states, not fake charts.
- No invented uptime. No fake customer logos. No mock charts pretending to be production.
- If we haven't earned a claim, we don't make it.
- Straight answers. No sales fog.

**Alt text**
- “Abstract 3D gateway mark: three translucent ribbons orbit a glowing cyan core.”
- “Tanvelo request inspector showing an example fallback from OpenAI to Anthropic.”
- “Before-and-after diagram: three tangled provider integrations versus one Tanvelo gateway.”

---

## 9. Inspiration and research notes

These are the references used to shape the direction. Award status is only claimed where verified; the rest are craft benchmarks.

| Reference | Why it matters | What to borrow | What not to copy |
|---|---|---|---|
| [Lusion](https://lusion.co) — Awwwards SOTD/SOTY, multiple awards | Real-time 3D storytelling studio | One cinematic 3D moment, material quality, restrained black/white palette, scroll choreography | Heavy full-screen WebGL, scroll hijacking, portfolio navigation |
| [Oryzo AI](https://oryzo.ai) by Lusion — Awwwards Site of the Month, Apr 2026 | Playful 3D product storytelling | Confidence, tactile 3D, scroll-driven scenes, strong art direction | Satirical claims, fictional product tone, joke copy |
| [Linear](https://linear.app) — design benchmark for developer SaaS | “The product is the demo” | Precision, tight typography, one accent, product UI as proof, generous whitespace | Exact layout, purple hue, extreme minimalism that hides the product |
| [Raycast](https://raycast.com) — design benchmark | Tactile product object and real community proof | One hero object with studio lighting, micro-interactions, named proof | Keyboard motif, playful red brand, extension-store clutter |
| [Vercel](https://vercel.com) — developer-infrastructure benchmark | Monochrome confidence and code-native copy | Black/white discipline, terse headlines, real customer proof | Exact Geist/triangle identity, enterprise ambiguity |
| [Spline](https://spline.design) — 3D design tool | Product-led 3D with a clean explanation | 3D as a brand asset, simple three-step story, approachable technical copy | Pastel gradients, tool-specific UI, agent hype |
| [Clerk](https://clerk.com) — developer-trust benchmark | Answers “how hard is it to integrate?” early | Code snippet near the top, clear value prop, named testimonials, no-nonsense docs | Auth-specific layout, testimonial wall |
| [Unseen Studio](https://unseen.co) — Awwwards multi-award studio | Bold minimal typography, one idea per screen | Editorial confidence, whitespace, strong section rhythm | Experimental navigation, sound-first entry, portfolio-only structure |
| [Awwwards 3D / Sites of the Day](https://www.awwwards.com/websites/3d) | Current 3D and interaction craft | Tactile materials, editorial type, one signature interaction | Full-bleed experiments that sacrifice clarity and performance |

**Key observations**

- The strongest developer sites let the product do the talking: a real interface, a code sample, or a precise mechanism — not a wall of adjectives.
- Award-winning 3D sites use *one* memorable object or scene. They do not decorate every section with 3D.
- The best dark sites use near-black, not pure black, and a single accent. Color is scarce, so it signals importance.
- Real proof beats invented proof. Provider compatibility, exact security mechanisms, docs, and code are stronger than fake logos.
- Motion should be felt, not fought. No scroll hijacking; respect reduced motion.
- The most trustworthy pages state limits plainly: “where enforcement is reliable,” “estimated cost,” “supported parameters and known differences.”

**Psychology research consulted**

- Cialdini’s principles: social proof, authority, reciprocity, commitment/consistency, liking, scarcity (used honestly, or not at all).
- Cognitive fluency: simple copy and clear hierarchy increase trust and action.
- Loss aversion: losses feel roughly twice as strong as equivalent gains; use it to frame reliability and cost control, not to fear-monger.
- Anchoring: the before/after comparison anchors the single gateway as the simpler choice.
- Von Restorff / isolation effect: one distinctive 3D object and one bright CTA stand out because everything else is quiet.
- Zeigarnik effect: an interactive route demo and an open FAQ item create small, satisfying loops.
- Goal gradient: numbered quickstart steps make progress visible.
- Hick’s law and Fitts’s law: fewer choices and larger targets reduce friction.
- Peak-end rule: the hero and final CTA define the memory.
- Aesthetic-usability effect: polished craft signals competence, but only if the page stays fast.

**Sources consulted:** [Website Conversion Psychology in 2026](https://www.sanjaydey.com/website-conversion-psychology-2026), [Psychological Principles in CRO](https://www.awa-digital.com/blog/psychological-principles-in-cro), [Loss Aversion Marketing](https://ventureharbour.com/loss-aversion-7-ways-to-use-it-to-boost-your-conversions-with-examples), [The Psychology of Conversion Copy](https://www.whatconverts.com/blog/conversion-copy), and [Social Proof and Trust Signals](https://discoveredlabs.com/blog/social-proof-and-trust-signals-for-conversion-rate-optimization-implementation-and-impact).

**What we deliberately avoided**

- Fake customer logos, invented testimonials, “trusted by 10,000+ teams,” and unearned certification badges.
- “AI-powered” language for a deterministic routing product.
- Generic AI art: glowing brains, robots, chips, clouds, neural networks, floating hexagons, purple mesh gradients.
- Full-screen WebGL, scroll hijacking, autoplay sound, and custom cursors.
- Pricing, signup, and dashboard-auth UI that do not exist in the product.
- Dark patterns: fake scarcity, countdowns, hidden limits, or a “book a demo” button with no demo.

---

## 10. Build handoff and QA

**Recommended implementation**

- Next.js 14 App Router, React, TypeScript, Tailwind CSS.
- 3D: React Three Fiber + Drei, or a Spline scene embedded via `@splinetool/react-spline`.
- Motion: Framer Motion for UI; GSAP ScrollTrigger only if needed for the hero scroll rotation. Avoid two animation systems fighting each other.
- Smooth scroll: optional Lenis, with native fallback. Do not hijack scroll.
- Icons: Lucide React.
- Fonts: Geist + Inter + JetBrains Mono via `next/font`.

**Assets**

- Logo: SVG primary, mono, icon-only, favicon.
- 3D: GLB/GLTF under 2 MB, compressed with Draco or Meshopt; poster AVIF/WebP.
- OG image: 1200 × 630, dark background, logo + “Every model. One gateway. Total control.”
- App icon: 1024 × 1024 PNG, plus favicon SVG and Apple touch icon.

**Performance**

- LCP under 2.5s, CLS under 0.1, INP under 200ms.
- Lazy-load the 3D scene after the poster and hero copy render. Never block the LCP on WebGL.
- Cap device pixel ratio at 1.5. Disable post-processing on mobile. Use a static poster for reduced motion and small screens.
- Target 60fps on desktop; degrade gracefully on low-power devices.
- Lighthouse targets: Performance 90+, Accessibility 100, Best Practices 95+.

**SEO and metadata**

- Title: “Tanvelo — One gateway for every LLM.”
- Description: “Route OpenAI, Anthropic, and Gemini through one OpenAI-compatible API with deterministic fallbacks, rate limits, budgets, and real telemetry.”
- Canonical URL, Open Graph image, Twitter card.
- JSON-LD `SoftwareApplication` with name, description, and URL. Do not add fake ratings or reviews.
- One `h1`, logical heading order, descriptive alt text.

**Analytics events (privacy-friendly, no cookies if possible)**

- `cta_quickstart_click`
- `cta_dashboard_click`
- `code_copy`
- `faq_open`
- `route_demo_interaction`
- `scroll_depth` (25/50/75/100)
- `3d_loaded` / `3d_fallback`

**QA checklist**

- [ ] The 5-second test passes at 1440×900 and 390×844.
- [ ] The primary CTA is visible above the fold.
- [ ] No horizontal scroll at 320px.
- [ ] Every example data point is labeled “EXAMPLE.”
- [ ] No fake logos, testimonials, metrics, badges, or urgency.
- [ ] All claims match the actual product and docs.
- [ ] The secondary CTA does not expose a private management dashboard.
- [ ] The logo is legible at 16px; the favicon reads at 16px.
- [ ] The 3D scene does not block LCP; reduced motion shows a static poster.
- [ ] Keyboard focus is visible everywhere; accordion and copy buttons work.
- [ ] Contrast passes WCAG AA.
- [ ] Mobile sticky CTA does not cover content or the footer.
- [ ] The page feels calm with the 3D removed — the layout still works.
- [ ] The final CTA and footer feel like a deliberate ending, not an afterthought.

---

## 11. The one-sentence direction

**Tanvelo should look like the calm, precise front door to a production command center: one cinematic glass gate, one honest promise, and no noise between the developer and the quickstart.**

If a design decision adds decoration but not clarity, remove it.
