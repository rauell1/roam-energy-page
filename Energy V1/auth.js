/* ── Roam Energy — User Auth Module ──────────────────────────────────────── */
(function () {
  const SUPA_URL  = 'https://akbmydsqorsoijxsmwrh.supabase.co';
  const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYm15ZHNxb3Jzb2lqeHNtd3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzgyNDMsImV4cCI6MjA5NDYxNDI0M30.7zqrrNdn4golHcw9IFhFZemxfu0NGzdhqHPdflxSbSU';

  const TK = 'rae_token';
  const UK = 'rae_user';

  /* ── Storage ─────────────────────────────────────────────────────────── */
  function getToken()  { return localStorage.getItem(TK) || ''; }
  function getUser()   { try { return JSON.parse(localStorage.getItem(UK) || 'null'); } catch { return null; } }
  function setSession(token, user) {
    localStorage.setItem(TK, token);
    localStorage.setItem(UK, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(TK);
    localStorage.removeItem(UK);
  }

  /* ── API helpers ──────────────────────────────────────────────────────── */
  async function supaFetch(path, opts = {}) {
    const token = getToken();
    return fetch(SUPA_URL + path, {
      ...opts,
      headers: {
        'apikey': SUPA_ANON,
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
  }

  async function apiSignUp(email, password) {
    const r = await supaFetch('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error_description || j.msg || 'Sign up failed');
    return j;
  }

  async function apiSignIn(email, password) {
    const r = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SUPA_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error_description || j.msg || 'Invalid email or password');
    return j;
  }

  async function apiSignOut() {
    await supaFetch('/auth/v1/logout', { method: 'POST' }).catch(() => {});
    clearSession();
  }

  async function upsertProfile(userId, email, fullName, phone) {
    await supaFetch('/rest/v1/profiles', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: userId, email, full_name: fullName, phone }),
    });
  }

  async function fetchProfile() {
    const r = await supaFetch('/rest/v1/profiles?select=*&limit=1');
    if (!r.ok) return null;
    const rows = await r.json();
    return rows[0] || null;
  }

  /* ── Inject modal HTML ────────────────────────────────────────────────── */
  function injectModal() {
    if (document.getElementById('rae-auth-modal')) return;
    const el = document.createElement('div');
    el.innerHTML = `
<div id="rae-auth-backdrop" class="rae-backdrop hidden"></div>
<div id="rae-auth-modal" class="rae-modal hidden" role="dialog" aria-modal="true" aria-label="Account">

  <!-- ─ Sign-in / Sign-up view ─ -->
  <div id="rae-auth-view">
    <button class="rae-modal-close" id="rae-close-btn" aria-label="Close">&times;</button>
    <div class="rae-modal-logo">
      <img src="Roam_Logo.png" alt="Roam Energy">
    </div>

    <div class="rae-tabs" role="tablist">
      <button class="rae-tab rae-tab--active" id="rae-tab-in"  role="tab" data-tab="in">Sign In</button>
      <button class="rae-tab"                  id="rae-tab-up"  role="tab" data-tab="up">Create Account</button>
    </div>

    <!-- Sign In form -->
    <form id="rae-signin-form" class="rae-form" novalidate>
      <div class="rae-field">
        <label for="rae-in-email">Email</label>
        <input id="rae-in-email" type="email" placeholder="you@example.com" autocomplete="email" required>
      </div>
      <div class="rae-field">
        <label for="rae-in-pw">Password</label>
        <input id="rae-in-pw" type="password" placeholder="••••••••" autocomplete="current-password" required>
      </div>
      <p class="rae-error hidden" id="rae-in-error"></p>
      <button type="submit" class="rae-btn-primary" id="rae-in-submit">Sign In</button>
    </form>

    <!-- Sign Up form -->
    <form id="rae-signup-form" class="rae-form hidden" novalidate>
      <div class="rae-field">
        <label for="rae-up-name">Full Name</label>
        <input id="rae-up-name" type="text" placeholder="Jane Doe" autocomplete="name" required>
      </div>
      <div class="rae-field">
        <label for="rae-up-email">Email</label>
        <input id="rae-up-email" type="email" placeholder="you@example.com" autocomplete="email" required>
      </div>
      <div class="rae-field">
        <label for="rae-up-phone">Phone Number</label>
        <input id="rae-up-phone" type="tel" placeholder="+254 7XX XXX XXX" autocomplete="tel">
      </div>
      <div class="rae-field">
        <label for="rae-up-pw">Password</label>
        <input id="rae-up-pw" type="password" placeholder="Min 6 characters" autocomplete="new-password" required>
      </div>
      <p class="rae-error hidden" id="rae-up-error"></p>
      <p class="rae-success hidden" id="rae-up-success"></p>
      <button type="submit" class="rae-btn-primary" id="rae-up-submit">Create Account</button>
    </form>
  </div>

  <!-- ─ Profile view (shown when signed in) ─ -->
  <div id="rae-profile-view" class="hidden">
    <button class="rae-modal-close" id="rae-profile-close-btn" aria-label="Close">&times;</button>
    <div class="rae-profile-header">
      <div class="rae-avatar" id="rae-avatar-initials">?</div>
      <div>
        <p class="rae-profile-name" id="rae-profile-name"></p>
        <p class="rae-profile-email" id="rae-profile-email"></p>
      </div>
    </div>
    <form id="rae-profile-form" class="rae-form" novalidate>
      <div class="rae-field">
        <label for="rae-pf-name">Full Name</label>
        <input id="rae-pf-name" type="text" placeholder="Full Name" autocomplete="name">
      </div>
      <div class="rae-field">
        <label for="rae-pf-phone">Phone Number</label>
        <input id="rae-pf-phone" type="tel" placeholder="+254 7XX XXX XXX" autocomplete="tel">
      </div>
      <p class="rae-success hidden" id="rae-pf-success"></p>
      <button type="submit" class="rae-btn-primary">Save Changes</button>
    </form>
    <hr class="rae-divider">
    <button class="rae-btn-ghost" id="rae-signout-btn">
      <i class="fas fa-sign-out-alt"></i> Sign Out
    </button>
  </div>

</div>`;
    document.body.appendChild(el);
  }

  /* ── Nav button helpers ───────────────────────────────────────────────── */
  function updateNavBtn() {
    const btn = document.getElementById('nav-auth-btn');
    if (!btn) return;
    const user = getUser();
    if (user) {
      const initials = (user.full_name || user.email || '?')[0].toUpperCase();
      btn.innerHTML = `<span class="nav-auth-avatar">${initials}</span>`;
      btn.title = user.full_name || user.email;
    } else {
      btn.innerHTML = '<i class="fas fa-user-circle"></i>';
      btn.title = 'Sign In / Create Account';
    }
  }

  /* ── Open / close modal ───────────────────────────────────────────────── */
  function openModal(tab) {
    const modal    = document.getElementById('rae-auth-modal');
    const backdrop = document.getElementById('rae-auth-backdrop');
    const user = getUser();

    // Show the right view
    document.getElementById('rae-auth-view').classList.toggle('hidden', !!user);
    document.getElementById('rae-profile-view').classList.toggle('hidden', !user);

    if (user) {
      document.getElementById('rae-profile-name').textContent  = user.full_name  || 'Account';
      document.getElementById('rae-profile-email').textContent = user.email || '';
      document.getElementById('rae-avatar-initials').textContent = (user.full_name || user.email || '?')[0].toUpperCase();
      document.getElementById('rae-pf-name').value  = user.full_name || '';
      document.getElementById('rae-pf-phone').value = user.phone     || '';
    } else if (tab) {
      switchTab(tab);
    }

    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    requestAnimationFrame(() => {
      modal.classList.add('rae-modal--open');
      backdrop.classList.add('rae-backdrop--open');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal    = document.getElementById('rae-auth-modal');
    const backdrop = document.getElementById('rae-auth-backdrop');
    modal.classList.remove('rae-modal--open');
    backdrop.classList.remove('rae-backdrop--open');
    setTimeout(() => {
      modal.classList.add('hidden');
      backdrop.classList.add('hidden');
      document.body.style.overflow = '';
    }, 220);
  }

  /* ── Tab switching ────────────────────────────────────────────────────── */
  function switchTab(tab) {
    const isIn = tab === 'in';
    document.getElementById('rae-tab-in').classList.toggle('rae-tab--active', isIn);
    document.getElementById('rae-tab-up').classList.toggle('rae-tab--active', !isIn);
    document.getElementById('rae-signin-form').classList.toggle('hidden', !isIn);
    document.getElementById('rae-signup-form').classList.toggle('hidden', isIn);
  }

  /* ── Wire up all events ───────────────────────────────────────────────── */
  function wireEvents() {
    // Nav button
    const navBtn = document.getElementById('nav-auth-btn');
    if (navBtn) navBtn.addEventListener('click', openModal);

    // Close buttons & backdrop
    document.getElementById('rae-close-btn').addEventListener('click', closeModal);
    document.getElementById('rae-profile-close-btn').addEventListener('click', closeModal);
    document.getElementById('rae-auth-backdrop').addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // Tabs
    document.getElementById('rae-tab-in').addEventListener('click', () => switchTab('in'));
    document.getElementById('rae-tab-up').addEventListener('click', () => switchTab('up'));

    /* ── Sign In ── */
    document.getElementById('rae-signin-form').addEventListener('submit', async e => {
      e.preventDefault();
      const btn   = document.getElementById('rae-in-submit');
      const errEl = document.getElementById('rae-in-error');
      const email = document.getElementById('rae-in-email').value.trim();
      const pw    = document.getElementById('rae-in-pw').value;
      errEl.classList.add('hidden');
      btn.disabled = true; btn.textContent = 'Signing in…';
      try {
        const json = await apiSignIn(email, pw);
        // Fetch profile to get name/phone
        setSession(json.access_token, { email: json.user.email, id: json.user.id });
        const profile = await fetchProfile();
        setSession(json.access_token, {
          email: json.user.email,
          id: json.user.id,
          full_name: profile?.full_name || '',
          phone: profile?.phone || '',
        });
        updateNavBtn();
        closeModal();
        dispatchAuthEvent('signed-in');
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false; btn.textContent = 'Sign In';
      }
    });

    /* ── Sign Up ── */
    document.getElementById('rae-signup-form').addEventListener('submit', async e => {
      e.preventDefault();
      const btn      = document.getElementById('rae-up-submit');
      const errEl    = document.getElementById('rae-up-error');
      const successEl= document.getElementById('rae-up-success');
      const fullName = document.getElementById('rae-up-name').value.trim();
      const email    = document.getElementById('rae-up-email').value.trim();
      const phone    = document.getElementById('rae-up-phone').value.trim();
      const pw       = document.getElementById('rae-up-pw').value;
      errEl.classList.add('hidden');
      successEl.classList.add('hidden');
      if (!fullName) { errEl.textContent = 'Please enter your full name.'; errEl.classList.remove('hidden'); return; }
      if (pw.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.classList.remove('hidden'); return; }
      btn.disabled = true; btn.textContent = 'Creating account…';
      try {
        const json = await apiSignUp(email, pw);
        if (json.access_token) {
          // Auto-confirmed — log them in immediately
          setSession(json.access_token, {
            email: json.user.email,
            id: json.user.id,
            full_name: fullName,
            phone,
          });
          await upsertProfile(json.user.id, email, fullName, phone);
          updateNavBtn();
          closeModal();
          dispatchAuthEvent('signed-in');
        } else {
          // Email confirmation required
          successEl.textContent = 'Account created! Check your email to confirm, then sign in.';
          successEl.classList.remove('hidden');
          btn.disabled = false; btn.textContent = 'Create Account';
        }
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'Create Account';
      }
    });

    /* ── Update Profile ── */
    document.getElementById('rae-profile-form').addEventListener('submit', async e => {
      e.preventDefault();
      const btn      = e.target.querySelector('button[type=submit]');
      const successEl= document.getElementById('rae-pf-success');
      const fullName = document.getElementById('rae-pf-name').value.trim();
      const phone    = document.getElementById('rae-pf-phone').value.trim();
      successEl.classList.add('hidden');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const user = getUser();
        await upsertProfile(user.id, user.email, fullName, phone);
        setSession(getToken(), { ...user, full_name: fullName, phone });
        document.getElementById('rae-profile-name').textContent = fullName || user.email;
        document.getElementById('rae-avatar-initials').textContent = (fullName || user.email || '?')[0].toUpperCase();
        updateNavBtn();
        successEl.textContent = 'Profile saved!';
        successEl.classList.remove('hidden');
        dispatchAuthEvent('profile-updated');
      } catch (err) {
        // silently ignore — profile update is best-effort
      } finally {
        btn.disabled = false; btn.textContent = 'Save Changes';
      }
    });

    /* ── Sign Out ── */
    document.getElementById('rae-signout-btn').addEventListener('click', async () => {
      await apiSignOut();
      updateNavBtn();
      closeModal();
      dispatchAuthEvent('signed-out');
    });
  }

  /* ── Custom event so products.js can react ────────────────────────────── */
  function dispatchAuthEvent(type) {
    document.dispatchEvent(new CustomEvent('rae:auth', { detail: { type } }));
  }

  /* ── Public API (on window for cross-script access) ──────────────────── */
  window.raeAuth = {
    getToken,
    getUser,
    isLoggedIn: () => !!getToken(),
    openModal,
    closeModal,
  };

  /* ── Boot ─────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    injectModal();
    wireEvents();
    updateNavBtn();
  });
})();
