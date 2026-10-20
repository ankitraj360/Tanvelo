/**
 * Tanvelo landing v2 — page behavior
 * Kept deliberately small: 3D boot, reveal timing, header state,
 * the failover trace simulator, and clipboard feedback.
 */

// ---------------------------------------------------------------------------
// 3D key visual (isolated so a WebGL failure never breaks the page)
// ---------------------------------------------------------------------------
const stage = document.getElementById("gateway-stage");

import("./prism.js")
  .then(({ initGatewayScene }) => initGatewayScene("gateway-canvas"))
  .catch((error) => {
    console.warn("Tanvelo 3D: scene could not start.", error);
    stage?.classList.add("has-fallback");
  });

// ---------------------------------------------------------------------------
// Header state
// ---------------------------------------------------------------------------
const header = document.getElementById("site-header");

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

// ---------------------------------------------------------------------------
// Scroll reveals
// ---------------------------------------------------------------------------
const revealElements = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-in"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

// ---------------------------------------------------------------------------
// Failover simulator
// ---------------------------------------------------------------------------
const traceBody = document.getElementById("trace-body");
const traceNote = document.querySelector('[data-field="note"]');
const triggerButtons = document.querySelectorAll(".trigger");

const traceStates = {
  "429": {
    primaryCode: "429",
    primaryTime: "0.18s",
    fallbackProvider: "Anthropic",
    fallbackModel: "claude-3-5-sonnet",
    fallbackTime: "1.06s",
    total: "1.24s total",
    note: "policy · openai → anthropic · budget guard passed"
  },
  timeout: {
    primaryCode: "504",
    primaryTime: "8.00s",
    fallbackProvider: "Google",
    fallbackModel: "gemini-2.0-flash",
    fallbackTime: "0.94s",
    total: "8.94s total",
    note: "policy · timeout 8s → gemini · request served"
  },
  "5xx": {
    primaryCode: "503",
    primaryTime: "0.09s",
    fallbackProvider: "Anthropic",
    fallbackModel: "claude-3-5-sonnet",
    fallbackTime: "0.62s",
    total: "0.71s total",
    note: "policy · openai → anthropic · outage isolated"
  }
};

function setField(name, value) {
  const field = traceBody?.querySelector(`[data-field="${name}"]`);
  if (field) field.textContent = value;
}

function updateTrace(stateKey) {
  const state = traceStates[stateKey];
  if (!state) return;

  const primaryRow = traceBody?.querySelector('[data-row="primary"]');
  const fallbackRow = traceBody?.querySelector('[data-row="fallback"]');

  [primaryRow, fallbackRow].forEach((row) => {
    if (!row) return;
    row.classList.remove("is-updating");
    void row.offsetWidth;
    row.classList.add("is-updating");
  });

  setField("primary-code", state.primaryCode);
  setField("primary-time", state.primaryTime);
  setField("fallback-model", state.fallbackModel);
  setField("fallback-time", state.fallbackTime);
  setField("total-time", state.total);
  setField("response", "200 OK");

  const fallbackProvider = fallbackRow?.querySelector(".trace-provider");
  if (fallbackProvider) fallbackProvider.textContent = state.fallbackProvider;

  if (traceNote) traceNote.textContent = state.note;

  triggerButtons.forEach((button) => {
    const active = button.dataset.state === stateKey;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  window.setTimeout(() => {
    [primaryRow, fallbackRow].forEach((row) => row?.classList.remove("is-updating"));
  }, 380);
}

triggerButtons.forEach((button) => {
  button.addEventListener("click", () => updateTrace(button.dataset.state));
});

// ---------------------------------------------------------------------------
// Copy quickstart
// ---------------------------------------------------------------------------
const copyButton = document.getElementById("copy-code");
const quickstartCode = document.getElementById("quickstart-code");

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some browsers expose the API but reject it without a clipboard grant;
      // fall through to the selection-based method.
    }
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand("copy");
  helper.remove();

  if (!copied) throw new Error("Clipboard write was rejected.");
}

copyButton?.addEventListener("click", async () => {
  if (!quickstartCode) return;

  const label = copyButton.querySelector("span");
  const original = label?.textContent || "Copy";

  try {
    await copyText(quickstartCode.textContent);
    copyButton.classList.add("is-copied");
    if (label) label.textContent = "Copied";
  } catch (error) {
    console.warn("Copy failed.", error);
    if (label) label.textContent = "Select to copy";
  }

  window.setTimeout(() => {
    copyButton.classList.remove("is-copied");
    if (label) label.textContent = original;
  }, 1800);
});
