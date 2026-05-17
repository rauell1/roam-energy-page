/* ── Roam Energy — Shared JS ─────────────────────────────── */

const WHATSAPP_NUMBER = (window.ROAM_WHATSAPP_NUMBER || '254704612435').replace(/\D/g, '');
window.ROAM_WHATSAPP_NUMBER = WHATSAPP_NUMBER;

function buildWhatsAppLink(message) {
  const params = new URLSearchParams({ app_absent: '0' });
  if (message) params.set('text', message);
  return `https://wa.me/${WHATSAPP_NUMBER}?${params.toString()}`;
}

/* ── AOS ────────────────────────────────────────────────── */
if (typeof AOS !== 'undefined') {
  AOS.init({ duration: 750, once: true, offset: 60 });
}

/* ── Navigation ─────────────────────────────────────────── */
const nav         = document.getElementById('site-nav');
const hamburger   = document.getElementById('nav-hamburger');
const mobileMenu  = document.getElementById('nav-mobile');

if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });
  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

/* ── FAQ accordion ──────────────────────────────────────── */
document.querySelectorAll('.faq-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const item    = btn.closest('.faq-item');
    const content = btn.nextElementSibling;
    const isOpen  = item.classList.contains('open');

    // Close all
    document.querySelectorAll('.faq-item.open').forEach(el => {
      el.classList.remove('open');
      el.querySelector('.faq-content').classList.remove('active');
    });

    // Open clicked if it was closed
    if (!isOpen) {
      item.classList.add('open');
      content.classList.add('active');
    }
  });
});

/* ── Floating WhatsApp FAB ───────────────────────────────── */
const fab = document.getElementById('whatsapp-fab');
if (fab) {
  window.addEventListener('scroll', () => {
    const scrolled   = window.scrollY > 300;
    const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 200);
    fab.classList.toggle('visible', scrolled || nearBottom);
  }, { passive: true });
}

/* ── Smooth scroll for anchor links ─────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-h')) || 72;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
