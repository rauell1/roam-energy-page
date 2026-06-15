/* ── Roam Energy — Shared JS ─────────────────────────────── */

/* ── Page transition overlay ─────────────────────────────── */
(function () {
  const overlay = document.getElementById('page-overlay');
  if (!overlay) return;

  document.body.classList.add('page-ready');

  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel') ||
        href.startsWith('//') || a.target === '_blank') return;
    a.addEventListener('click', e => {
      e.preventDefault();
      const dest = href;
      document.body.classList.remove('page-ready');
      setTimeout(() => { window.location.href = dest; }, 320);
    });
  });
})();

/* ── Scroll progress bar ──────────────────────────────────── */
(function () {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
  }, { passive: true });
})();

/* ── Hero parallax ───────────────────────────────────────── */
(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY < window.innerHeight) {
      hero.style.backgroundPositionY = `calc(40% + ${window.scrollY * 0.3}px)`;
    }
  }, { passive: true });
})();

/* ── Animated stat counters ──────────────────────────────── */
(function () {
  const statEls = document.querySelectorAll('.stat-number[data-count]');
  if (!statEls.length) return;

  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const isDecimal = el.dataset.decimal === 'true';
    const duration = 1600;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString()) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  statEls.forEach(el => obs.observe(el));
})();

const WHATSAPP_NUMBER = (window.ROAM_WHATSAPP_NUMBER || '254704612435').replace(/\D/g, '');
window.ROAM_WHATSAPP_NUMBER = WHATSAPP_NUMBER;

function buildWhatsAppLink(message) {
  const params = new URLSearchParams({ app_absent: '0' });
  if (message) params.set('text', message);
  return `https://wa.me/${WHATSAPP_NUMBER}?${params.toString()}`;
}

/* ── AOS ────────────────────────────────────────────────── */
if (typeof AOS !== 'undefined') {
  AOS.init({
    duration: 680,
    once: true,
    offset: 60,
    easing: 'ease-out-quart',
    mirror: false,
    anchorPlacement: 'top-bottom',
  });
}

/* ── Section reveal observer (for pages without AOS CDN) ── */
(function () {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => obs.observe(el));
})();

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
  const SUPABASE_URL  = 'https://akbmydsqorsoijxsmwrh.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYm15ZHNxb3Jzb2lqeHNtd3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzgyNDMsImV4cCI6MjA5NDYxNDI0M30.7zqrrNdn4golHcw9IFhFZemxfu0NGzdhqHPdflxSbSU';

  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn   = form.querySelector('button[type="submit"]');
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : '';
      if (!email) return;

      btn.disabled = true;
      btn.textContent = '\u2026';
      try {
        // 1. Save to Supabase subscribers table
        await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON,
            'Authorization': `Bearer ${SUPABASE_ANON}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({ email })
        });
      } catch (err) {
        console.warn('Supabase subscription failed:', err);
      }

      try {
        // 2. Submit to FormSubmit.co for notification
        await fetch('https://formsubmit.co/ajax/roy.otieno@roam-electric.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email, _subject: 'Newsletter Signup: Roam Energy' })
        });
      } catch (_) { /* silent */ }

      form.innerHTML = '<p class="newsletter-success">Subscribed! \u2705 Thanks for joining.</p>';
    });
  });
})();

/* \u2500\u2500 Solar Savings Calculator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
(function () {
  const billSlider    = document.getElementById('monthlyBill');
  const sizeSlider    = document.getElementById('systemSize');
  const batterySlider = document.getElementById('batteryStorage');
  if (!billSlider) return;

  function fmt(n) { return 'KES ' + Math.round(n).toLocaleString(); }

  function compute() {
    const bill    = +billSlider.value;
    const size    = +sizeSlider.value;
    const battery = +batterySlider.value;

    document.getElementById('billDisplay').textContent    = 'KES ' + bill.toLocaleString();
    document.getElementById('sizeDisplay').textContent    = size + ' kWp';
    document.getElementById('batteryDisplay').textContent = battery + ' kWh';

    const coveragePct    = Math.min(0.88, 0.30 + (size * 0.012) + (battery > 0 ? 0.18 : 0));
    const monthlySavings = bill * coveragePct;
    const annualSavings  = monthlySavings * 12;
    const systemCost     = size * 115000 + battery * 14000;
    const payback        = annualSavings > 0 ? (systemCost / annualSavings).toFixed(1) : 'N/A';
    const co2kg          = Math.round(size * 1460 * 0.38);

    document.getElementById('monthlySavings').textContent = fmt(monthlySavings);
    document.getElementById('annualSavings').textContent  = fmt(annualSavings);
    document.getElementById('paybackPeriod').textContent  = payback + (payback !== 'N/A' ? ' yrs' : '');
    document.getElementById('co2Avoided').textContent     = co2kg.toLocaleString() + ' kg';
  }

  [billSlider, sizeSlider, batterySlider].forEach(s => s.addEventListener('input', compute));
  compute();
})();
