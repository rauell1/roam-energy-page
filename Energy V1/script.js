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
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

/* ── Active nav link ─────────────────────────────────────── */
(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('#')[0].split('/').pop() || 'index.html';
    if (href === path) {
      a.classList.add('nav-link--active');
      a.setAttribute('aria-current', 'page');
    }
  });
})();

/* ── FAQ accordion ──────────────────────────────────────── */
document.querySelectorAll('.faq-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const item    = btn.closest('.faq-item');
    const content = btn.nextElementSibling;
    const isOpen  = item.classList.contains('open');

    document.querySelectorAll('.faq-item.open').forEach(el => {
      el.classList.remove('open');
      el.querySelector('.faq-content').classList.remove('active');
    });

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

/* ── Contact form AJAX ───────────────────────────────────── */
(function () {
  const form     = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');
  const feedback  = document.getElementById('contact-feedback');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!submitBtn || !feedback) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending\u2026';
    feedback.className = '';
    feedback.textContent = '';

    const data = {
      name:    form.querySelector('[name="name"]').value,
      email:   form.querySelector('[name="email"]').value,
      phone:   form.querySelector('[name="phone"]')?.value || '',
      message: form.querySelector('[name="message"]').value,
      _subject: 'Roam Energy Enquiry',
      _captcha: 'false'
    };

    try {
      const res = await fetch('https://formsubmit.co/ajax/roy.otieno@roam-electric.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success === 'true' || json.success === true) {
        form.style.display = 'none';
        feedback.className = 'form-feedback form-feedback--success';
        feedback.textContent = '\u2705 Message sent! We\u2019ll be in touch within one business day.';
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      feedback.className = 'form-feedback form-feedback--error';
      feedback.textContent = '\u274C Something went wrong. Please email us directly at energy@roam-electric.com.';
    }
  });
})();

/* ── Newsletter form AJAX ────────────────────────────────── */
(function () {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn   = form.querySelector('button[type="submit"]');
      const email = form.querySelector('input[type="email"]').value;
      const orig  = btn.textContent;
      btn.disabled = true;
      btn.textContent = '\u2026';
      try {
        await fetch('https://formsubmit.co/ajax/roy.otieno@roam-electric.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email, _subject: 'Newsletter Signup — Roam Energy' })
        });
      } catch (_) { /* silent */ }
      form.innerHTML = '<p class="newsletter-success">Subscribed! \u2705 Thanks for joining.</p>';
    });
  });
})();
