// ===== GRID BACKGROUND (Interactive spotlight) =====
(function () {
  const grid = document.createElement('div');
  grid.id = 'grid-bg';
  document.body.insertBefore(grid, document.body.firstChild);

  const root = document.documentElement;
  let rafId = null;
  let mx = -9999, my = -9999;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      root.style.setProperty('--mx', mx + 'px');
      root.style.setProperty('--my', my + 'px');
      rafId = null;
    });
  });

  document.addEventListener('mouseleave', () => {
    root.style.setProperty('--mx', '-9999px');
    root.style.setProperty('--my', '-9999px');
  });
})();

// ===== THEME TOGGLE (Dark / Light) =====
(function () {
  const STORAGE_KEY = 'techvrs-theme';
  const root = document.documentElement;

  // SVG icons
  const moonSVG = `<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`;
  const sunSVG = `<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>`;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    // Keep nav/footer logos in sync with the active theme.
    if (typeof updateLogos === 'function') updateLogos();
  }

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply on every page load immediately (before paint)
  applyTheme(getPreferredTheme());

  // Wire up or inject the theme toggle button
  function setupButton() {
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer) return;

    let btn = document.querySelector('.theme-toggle');

    if (!btn) {
      // Fallback: inject if not already in HTML
      btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.innerHTML = moonSVG + sunSVG;
      const hamburger = navContainer.querySelector('.hamburger');
      navContainer.insertBefore(btn, hamburger || null);
    }

    // Always sync aria-label and wire click
    btn.setAttribute('aria-label', root.getAttribute('data-theme') === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(STORAGE_KEY)) applyTheme(e.matches ? 'dark' : 'light');
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupButton);
  } else {
    setupButton();
  }
})();

// ===== THEME & LOGO SWITCHING =====
// Logo follows the active theme (the data-theme attribute set by the toggle),
// falling back to the system preference if no theme has been applied yet.
function updateLogos() {
  const themeAttr = document.documentElement.getAttribute('data-theme');
  const isDarkMode = themeAttr
    ? themeAttr === 'dark'
    : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const logoImg = document.querySelector('.logo-img');
  const footerLogo = document.querySelector('.footer-logo');
  const logoSrc = isDarkMode ? '/assets/darkmode/favicon.svg' : '/assets/whitemode/favicon.svg';

  if (logoImg) logoImg.src = logoSrc;
  if (footerLogo) footerLogo.src = logoSrc;
}

// Update logos on load
document.addEventListener('DOMContentLoaded', updateLogos);

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ===== MOBILE MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

// ===== STAGGERED SCROLL REVEAL (token-driven) =====
// Automatically stamps data-reveal + data-delay on card grids.
// Observes [data-reveal] elements; adds .is-visible on entry.
// Removes will-change after transition to free compositor layers.
(function () {
  const GRID_SELECTORS = [
    '.services-grid',
    '.projects-grid',
    '.certs-grid',
    '.skills-wrapper',
    '.blog-grid',
    '.contact-channels',
  ];

  GRID_SELECTORS.forEach(sel => {
    const grid = document.querySelector(sel);
    if (!grid) return;
    Array.from(grid.children).forEach((child, i) => {
      child.setAttribute('data-reveal', '');
      child.setAttribute('data-delay', Math.min(i + 1, 6));
    });
  });

  // Section headers
  document.querySelectorAll('.section-header, .about-split > *, .hero-left > *').forEach(el => {
    if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      revealObserver.unobserve(el);
      // Free compositor layer after animation finishes
      el.addEventListener('transitionend', () => el.classList.add('anim-done'), { once: true });
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
})();

// ===== BLOG FILTER =====
const filterBtns = document.querySelectorAll('.filter-btn');
const blogCards = document.querySelectorAll('.blog-card');
if (filterBtns.length) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      blogCards.forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.cat === filter) ? 'flex' : 'none';
      });
    });
  });
}

// ===== ANIMATION 1: CUSTOM CURSOR =====
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const dot  = document.createElement('div'); dot.className  = 'cursor-dot';
  const ring = document.createElement('div'); ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  document.addEventListener('mousemove', e => {
    dot.style.left  = ring.style.left  = e.clientX + 'px';
    dot.style.top   = ring.style.top   = e.clientY + 'px';
  });

  const hoverTargets = 'a, button, [role="button"], input, select, textarea, label';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('cursor-hover'));
  });
})();

// ===== ANIMATION 2: SCROLL TEXT REVEAL =====
(function () {
  document.querySelectorAll('h1, h2, h3').forEach(el => {
    const inner = document.createElement('span');
    inner.className = 'reveal-text-inner';
    inner.innerHTML = el.innerHTML;
    el.innerHTML = '';
    el.classList.add('reveal-text');
    el.appendChild(inner);
  });

  const textObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        textObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.25 });

  document.querySelectorAll('.reveal-text').forEach(el => textObs.observe(el));
})();

// ===== ANIMATION 4: SMOOTH PAGE TRANSITION =====
(function () {
  const overlay = document.createElement('div');
  overlay.className = 'page-overlay';
  document.body.appendChild(overlay);

  overlay.classList.add('slide-out');
  overlay.addEventListener('animationend', () => overlay.classList.remove('slide-out'), { once: true });

  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || /^https?:\/\//.test(href) || link.target === '_blank') return;

    e.preventDefault();
    overlay.classList.remove('slide-out');
    overlay.classList.add('slide-in');
    overlay.addEventListener('animationend', () => {
      window.location.href = href;
    }, { once: true });
  });
})();

// ===== CONTACT FORM =====
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnIcon = document.getElementById('btn-icon');
    btn.disabled = true;
    btnText.textContent = 'Sending...';
    btnIcon.className = 'fas fa-spinner fa-spin';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        btnText.textContent = 'Message Sent!';
        btnIcon.className = 'fas fa-check';
        btn.style.background = '#16a34a';
        form.reset();
        setTimeout(() => {
          btnText.textContent = 'Send Message';
          btnIcon.className = 'fas fa-paper-plane';
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      } else {
        throw new Error();
      }
    } catch {
      btnText.textContent = 'Failed. Try email directly.';
      btnIcon.className = 'fas fa-times';
      btn.style.background = '#c0392b';
      btn.disabled = false;
    }
  });
}
