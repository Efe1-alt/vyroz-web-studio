// Always start at the top on load/refresh, instead of restoring scroll position
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Also covers back/forward-cache restores, which some browsers reposition otherwise
window.addEventListener('pageshow', () => window.scrollTo(0, 0));

// Nav: hard cut-in on scroll
const nav = document.getElementById('nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 40);
  lastScroll = y;
}, { passive: true });

// Mobile menu toggle
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');

burger.addEventListener('click', () => {
  mobileMenu.classList.toggle('is-open');
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('is-open'));
});

// Hero headline: word-by-word diagonal reveal — runs once the preloader
// (if shown) is fully gone, so the two intro animations never overlap.
function revealHeroHeadline() {
  const words = document.querySelectorAll('#heroHeadline .word');
  words.forEach((word, i) => {
    setTimeout(() => word.classList.add('reveal'), i * 55);
  });
}

// Preloader: shown once per browser session, then skipped on subsequent loads
window.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');

  if (!preloader) {
    revealHeroHeadline();
    return;
  }

  const INTRO_KEY = 'vyroz_intro_shown';
  let alreadyShown = false;
  try {
    alreadyShown = !!sessionStorage.getItem(INTRO_KEY);
  } catch (e) {}

  if (alreadyShown) {
    preloader.remove();
    revealHeroHeadline();
    return;
  }

  try { sessionStorage.setItem(INTRO_KEY, '1'); } catch (e) {}

  // Two-stage intro:
  //   Stage 1 — giant "VYROZ" wordmark, letter-by-letter wipe (1000ms total).
  //   Stage 2 — word swaps out for the large VZ mark, which draws itself in.
  //   Then: a short hold, and the overlay splits away to reveal the site.
  const STAGE1_DURATION = 1000; // 5 letters, evenly staggered (see .preloader-letter)
  const STAGE1_HOLD = 300;      // pause after "VYROZ" is fully written
  const STAGE2_START = STAGE1_DURATION + STAGE1_HOLD; // 1300ms
  const ICON_DRAW_DURATION = 600;
  const STAGE2_HOLD = 200;      // pause after the icon finishes drawing
  const EXIT_STAGGER = 70;      // right half starts slightly after the left — less mechanical
  const EXIT_DURATION = 800 + EXIT_STAGGER; // smooth ease-in-out split, staggered halves

  requestAnimationFrame(() => {
    preloader.classList.add('is-revealing'); // Stage 1: start the letter wipe
  });

  setTimeout(() => {
    preloader.classList.add('is-stage-two');   // swap text out, icon container in
    preloader.classList.add('is-icon-drawing'); // start the icon's stroke draw-in
  }, STAGE2_START);

  setTimeout(
    () => preloader.classList.add('is-exiting'),
    STAGE2_START + ICON_DRAW_DURATION + STAGE2_HOLD
  );

  setTimeout(() => {
    preloader.remove();
    revealHeroHeadline();
  }, STAGE2_START + ICON_DRAW_DURATION + STAGE2_HOLD + EXIT_DURATION + 20);
});

// Hero mockup: fades/slides in on load
window.addEventListener('DOMContentLoaded', () => {
  const mockup = document.querySelector('.hero-mockup-svg');
  if (mockup) setTimeout(() => mockup.classList.add('is-visible'), 0);
});

// Scroll-in reveal for sections
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach((el) => revealObserver.observe(el));

// Staggered diagonal reveal for row groups (e.g. services list)
const staggerEls = document.querySelectorAll('.stagger-group');
const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      staggerObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

staggerEls.forEach((el) => staggerObserver.observe(el));

// Scroll-spy: highlight the nav link matching the section in view
const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
const spySectionIds = ['services', 'why-vyroz', 'process', 'pricing', 'faq'];
let activeSectionId = null;

const spyObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const id = entry.target.id;
    if (entry.isIntersecting) {
      activeSectionId = id;
    } else if (id === spySectionIds[0] && entry.boundingClientRect.top >= 0) {
      // scrolled back above the first tracked section — back in the hero
      activeSectionId = null;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('href') === '#' + activeSectionId);
  });
}, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

spySectionIds.forEach((id) => {
  const section = document.getElementById(id);
  if (section) spyObserver.observe(section);
});

// Cookie consent: storage helpers
const COOKIE_CONSENT_KEY = 'vyroz_cookie_consent';

function getCookieConsent() {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveCookieConsent(consent) {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  } catch (e) {}
}

// TODO: replace 'G-XXXXXXXXXX' with the real GA4 Measurement ID before relying on this in production.
function loadGoogleAnalytics() {
  if (window.__gaLoaded) return;
  window.__gaLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
}

function applyCookieConsent(consent) {
  if (consent.analytics) loadGoogleAnalytics();
  // TODO: gate a marketing/ads pixel behind consent.marketing once one is configured.
}

// Cookie consent: modal wiring
const cookieOverlay = document.getElementById('cookieModalOverlay');
const cookieAnalyticsInput = document.getElementById('cookieConsentAnalytics');
const cookieMarketingInput = document.getElementById('cookieConsentMarketing');

function openCookieModal() {
  if (!cookieOverlay) return;
  const stored = getCookieConsent();
  cookieAnalyticsInput.checked = !!(stored && stored.analytics);
  cookieMarketingInput.checked = !!(stored && stored.marketing);
  cookieOverlay.classList.add('is-open');
}

function closeCookieModal() {
  if (cookieOverlay) cookieOverlay.classList.remove('is-open');
}

// Kept as the public entry point used by the "Отвори настройки" button and footer link.
function openCookiePreferences() {
  openCookieModal();
}

if (cookieOverlay) {
  const cookieClose = document.getElementById('cookieModalClose');
  const cookieSave = document.getElementById('cookieSaveChoice');
  const cookieAcceptAll = document.getElementById('cookieAcceptAll');

  cookieClose.addEventListener('click', closeCookieModal);
  cookieOverlay.addEventListener('click', (e) => {
    if (e.target === cookieOverlay) closeCookieModal();
  });

  cookieSave.addEventListener('click', () => {
    const consent = {
      necessary: true,
      analytics: cookieAnalyticsInput.checked,
      marketing: cookieMarketingInput.checked,
    };
    saveCookieConsent(consent);
    applyCookieConsent(consent);
    closeCookieModal();
  });

  cookieAcceptAll.addEventListener('click', () => {
    cookieAnalyticsInput.checked = true;
    cookieMarketingInput.checked = true;
    const consent = { necessary: true, analytics: true, marketing: true };
    saveCookieConsent(consent);
    applyCookieConsent(consent);
    closeCookieModal();
  });

  document.querySelectorAll('[data-cookie-settings-trigger]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openCookieModal();
    });
  });

  const existingConsent = getCookieConsent();
  if (existingConsent) {
    applyCookieConsent(existingConsent);
  } else {
    // First visit — no stored decision yet, so surface the modal.
    openCookieModal();
  }
}

// FAQ accordion
document.querySelectorAll('.faq-item').forEach((item) => {
  const question = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');

  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');

    document.querySelectorAll('.faq-item.is-open').forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove('is-open');
        openItem.querySelector('.faq-answer').style.maxHeight = null;
      }
    });

    item.classList.toggle('is-open', !isOpen);
    answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : null;
  });
});

// Quote form: submit via fetch (Web3Forms) instead of a full page reload
const quoteForm = document.getElementById('quoteForm');

if (quoteForm) {
  const quoteFormSuccess = document.getElementById('quoteFormSuccess');
  const quoteSubmitBtn = quoteForm.querySelector('button[type="submit"]');

  quoteForm.addEventListener('submit', (e) => {
    e.preventDefault();

    quoteSubmitBtn.disabled = true;

    fetch(quoteForm.action, {
      method: 'POST',
      body: new FormData(quoteForm),
      headers: { Accept: 'application/json' },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          quoteForm.reset();
          if (quoteFormSuccess) quoteFormSuccess.hidden = false;
        }
      })
      .finally(() => {
        quoteSubmitBtn.disabled = false;
      });
  });
}
