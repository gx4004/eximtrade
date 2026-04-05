/* ==========================================================
   Eximtrade — Micro-Animations
   Page fade transitions, stat counters, card stagger,
   scroll-driven content reveal
   ========================================================== */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Page Fade Transitions ---------- */
function initPageFade() {
  if (reducedMotion) {
    document.body.classList.add('page-visible');
    return;
  }

  // Fade in on load
  document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => document.body.classList.add('page-visible'));
  });

  // Intercept internal link clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Skip: anchors, external, mailto, tel, language buttons
    if (
      href.startsWith('#') ||
      href.startsWith('http') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      link.target === '_blank' ||
      link.hasAttribute('data-lang-btn')
    ) return;

    e.preventDefault();
    document.body.classList.remove('page-visible');
    setTimeout(() => { window.location.href = href; }, 350);
  });
}

/* ---------- Stat Counters ---------- */
function initCounters() {
  const els = document.querySelectorAll('[data-count-to]');
  if (!els.length) return;

  if (reducedMotion) {
    els.forEach(el => { el.textContent = el.dataset.countTo; });
    return;
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.countTo, 10);
    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.round(easeOut(progress) * target);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  els.forEach(el => observer.observe(el));
}

/* ---------- Card Stagger ---------- */
function initCardStagger() {
  // Find all parent elements that contain 2+ direct .fade-up children
  const parents = new Set();
  document.querySelectorAll('.fade-up').forEach(el => {
    if (el.parentElement) parents.add(el.parentElement);
  });

  parents.forEach(parent => {
    const children = Array.from(parent.querySelectorAll(':scope > .fade-up'));
    if (children.length < 2) return;
    children.forEach((child, i) => {
      // Only set if no inline delay already defined
      if (!child.style.transitionDelay) {
        child.style.transitionDelay = `${i * 0.08}s`;
      }
    });
  });
}

/* ---------- Scroll-Driven Video Section ---------- */
function initScrollVideo() {
  const wrapper = document.getElementById('scroll-video-wrapper');
  const video = document.getElementById('company-video');
  const content = document.getElementById('scroll-content');
  if (!wrapper || !video || !content) return;

  if (reducedMotion) {
    content.style.opacity = '1';
    content.style.transform = 'none';
    return;
  }

  // Video plays as autoplay loop (set in HTML).
  // Scroll controls content reveal + subtle overlay intensity.
  // This is smoother and more reliable than direct video.currentTime scrubbing.

  // Create a dynamic overlay that darkens/lightens with scroll
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;z-index:1;background:rgba(15,23,42,0.5);transition:background 0.15s ease;pointer-events:none;';
  const section = document.getElementById('company-section');
  if (section) section.appendChild(overlay);

  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const rect = wrapper.getBoundingClientRect();
      const wrapperHeight = wrapper.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollableDistance = wrapperHeight - viewportHeight;
      if (scrollableDistance <= 0) { ticking = false; return; }

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(scrolled / scrollableDistance, 1));

      // Content reveal: fades in during 25%-65% of scroll progress
      const contentProgress = Math.max(0, Math.min((progress - 0.25) / 0.4, 1));
      content.style.opacity = contentProgress;
      content.style.transform = `translateY(${(1 - contentProgress) * 30}px)`;

      // Dynamic overlay: starts darker, lightens mid-scroll, darkens at end
      // Creates subtle "breathing" effect that feels scroll-linked
      const overlayOpacity = 0.35 + 0.2 * Math.abs(progress - 0.5) * 2;
      overlay.style.background = `rgba(15,23,42,${overlayOpacity})`;

      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Init ---------- */
initPageFade();
initCounters();
initCardStagger();
initScrollVideo();
