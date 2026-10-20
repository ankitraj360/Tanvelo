/**
 * Tanvelo — Minimalist Interactivity (Light Theme, 60 FPS)
 */

import { initThreeGate } from './three-gate.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Silky Smooth 3D Canvas
  try {
    initThreeGate('hero-3d-canvas');
  } catch (e) {
    console.warn('3D initialization error:', e);
  }

  // 2. Scroll Progress & Sticky Navbar State
  const navbar = document.getElementById('navbar');
  const scrollTracker = document.getElementById('scroll-progress-bar');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > 20) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }

    if (scrollTracker) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      scrollTracker.style.width = `${progress}%`;
    }
  }, { passive: true });

  // 3. Multi-Language Code Tabs (Python / TypeScript / cURL)
  const tabButtons = document.querySelectorAll('.code-tab-btn');
  const codePanels = document.querySelectorAll('.code-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      codePanels.forEach(p => {
        if (p.getAttribute('data-lang') === lang) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
    });
  });

  // 4. One-Click Clipboard Copy with Feedback
  const copyBtn = document.getElementById('copy-btn');
  copyBtn?.addEventListener('click', async () => {
    const activePanel = document.querySelector('.code-panel.active');
    if (!activePanel) return;

    try {
      await navigator.clipboard.writeText(activePanel.textContent.trim());
      const originalHTML = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span style="color: #16A34A;">Copied</span>
      `;
      setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  });

  // 5. Accessible Minimal FAQ Accordion
  const faqRows = document.querySelectorAll('.faq-row');
  faqRows.forEach(row => {
    const btn = row.querySelector('.faq-btn');
    const body = row.querySelector('.faq-body');
    const symbol = btn?.querySelector('span:last-child');

    btn?.addEventListener('click', () => {
      const isOpen = body.style.maxHeight && body.style.maxHeight !== '0px';

      // Close all other rows
      faqRows.forEach(other => {
        const otherBody = other.querySelector('.faq-body');
        const otherSymbol = other.querySelector('.faq-btn span:last-child');
        if (otherBody) otherBody.style.maxHeight = '0px';
        if (otherSymbol) otherSymbol.textContent = '+';
      });

      if (!isOpen) {
        body.style.maxHeight = `${body.scrollHeight + 20}px`;
        if (symbol) symbol.textContent = '−';
      } else {
        body.style.maxHeight = '0px';
        if (symbol) symbol.textContent = '+';
      }
    });
  });

  // Open first FAQ by default
  const firstFaqBody = document.querySelector('.faq-row .faq-body');
  const firstSymbol = document.querySelector('.faq-row .faq-btn span:last-child');
  if (firstFaqBody) {
    firstFaqBody.style.maxHeight = `${firstFaqBody.scrollHeight + 20}px`;
    if (firstSymbol) firstSymbol.textContent = '−';
  }
});
