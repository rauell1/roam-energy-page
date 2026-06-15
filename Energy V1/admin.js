/* ── Roam Energy Admin Panel ─────────────────────────────── */

const API_BASE       = '/api/admin';
const SUPABASE_URL   = 'https://akbmydsqorsoijxsmwrh.supabase.co';
const SUPABASE_ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYm15ZHNxb3Jzb2lqeHNtd3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzgyNDMsImV4cCI6MjA5NDYxNDI0M30.7zqrrNdn4golHcw9IFhFZemxfu0NGzdhqHPdflxSbSU';
const ADMIN_EMAIL    = 'roy.otieno@roam-electric.com';

let ACCESS_TOKEN = sessionStorage.getItem('roam_admin_token') || '';

/* ── Toast ───────────────────────────────────────────────── */
function toast(msg, type = '') {
  const el = document.getElementById('admin-toast');
  el.textContent = msg;
  el.className = `admin-toast${type ? ' ' + type : ''} show`;
  setTimeout(() => el.classList.remove('show'), 3200);
}

/* ── API helpers ─────────────────────────────────────────── */
async function apiGet(table) {
  const res = await fetch(`${API_BASE}?table=${table}`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).data;
}

async function apiPost(body) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ACCESS_TOKEN}` },
    body: JSON.stringify(body)
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

/* ── Login ───────────────────────────────────────────────── */
const loginScreen = document.getElementById('login-screen');
const adminPanel  = document.getElementById('admin-panel');
const loginError  = document.getElementById('login-error');
const loginBtn    = document.getElementById('login-btn');

async function attemptLogin(email, password) {
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';
  loginError.classList.add('hidden');

  try {
    // Reject immediately — no Supabase round-trip needed for wrong email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Access denied. This account is not authorised for admin access.');
    }

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
      },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error_description || json.msg || 'Invalid credentials.');
    }

    // Double-check the token's claimed email (defence-in-depth)
    if (json.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Access denied. This account is not authorised for admin access.');
    }

    ACCESS_TOKEN = json.access_token;
    sessionStorage.setItem('roam_admin_token', ACCESS_TOKEN);
    showPanel();
  } catch (e) {
    loginError.textContent = e.message;
    loginError.classList.remove('hidden');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

loginBtn.addEventListener('click', () => {
  const email    = document.getElementById('email-input').value.trim();
  const password = document.getElementById('password-input').value;
  if (!email || !password) return;
  attemptLogin(email, password);
});

document.getElementById('email-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('password-input').focus();
});
document.getElementById('password-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') loginBtn.click();
});

/* ── Forgot password ─────────────────────────────────────── */
document.getElementById('forgot-link').addEventListener('click', () => {
  document.getElementById('signin-card').classList.add('hidden');
  document.getElementById('forgot-card').classList.remove('hidden');
  document.getElementById('forgot-email-input').value = document.getElementById('email-input').value;
});

document.getElementById('back-to-signin').addEventListener('click', () => {
  document.getElementById('forgot-card').classList.add('hidden');
  document.getElementById('signin-card').classList.remove('hidden');
});

document.getElementById('forgot-btn').addEventListener('click', async () => {
  const btn     = document.getElementById('forgot-btn');
  const msgEl   = document.getElementById('forgot-msg');
  const email   = document.getElementById('forgot-email-input').value.trim();
  msgEl.className = 'hidden';

  if (!email) { msgEl.textContent = 'Please enter your email.'; msgEl.className = 'forgot-error'; return; }

  // Only the authorised admin email may request a reset link
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    msgEl.textContent = 'Password reset is only available for the authorised admin account.';
    msgEl.className = 'forgot-error';
    return;
  }

  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    const redirectTo = window.location.origin + '/admin.html';
    await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirect_to: redirectTo }),
    });
    msgEl.textContent = 'Reset link sent! Check your inbox (and spam folder).';
    msgEl.className = 'forgot-success';
  } catch {
    msgEl.textContent = 'Something went wrong. Try again.';
    msgEl.className = 'forgot-error';
  } finally {
    btn.disabled = false; btn.textContent = 'Send Reset Link';
  }
});

/* ── Handle password reset redirect (URL hash from Supabase) ── */
(function () {
  const hash   = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  if (params.get('type') !== 'recovery') return;

  const token = params.get('access_token');
  if (!token) return;

  // Store token for the reset call, clean URL
  sessionStorage.setItem('roam_reset_token', token);
  history.replaceState(null, '', window.location.pathname);

  document.getElementById('signin-card').classList.add('hidden');
  document.getElementById('reset-card').classList.remove('hidden');
})();

document.getElementById('reset-btn').addEventListener('click', async () => {
  const btn       = document.getElementById('reset-btn');
  const errorEl   = document.getElementById('reset-error');
  const pw        = document.getElementById('new-password-input').value;
  const pw2       = document.getElementById('confirm-password-input').value;
  const resetToken = sessionStorage.getItem('roam_reset_token');
  errorEl.classList.add('hidden');

  if (pw.length < 8)  { errorEl.textContent = 'Password must be at least 8 characters.'; errorEl.classList.remove('hidden'); return; }
  if (pw !== pw2)     { errorEl.textContent = 'Passwords do not match.'; errorEl.classList.remove('hidden'); return; }
  if (!resetToken)    { errorEl.textContent = 'Reset session expired. Request a new link.'; errorEl.classList.remove('hidden'); return; }

  btn.disabled = true; btn.textContent = 'Updating…';
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'apikey': SUPABASE_ANON,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resetToken}`,
      },
      body: JSON.stringify({ password: pw }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.msg || json.error_description || 'Update failed.');

    sessionStorage.removeItem('roam_reset_token');
    document.getElementById('reset-card').classList.add('hidden');
    document.getElementById('signin-card').classList.remove('hidden');
    loginError.textContent = '';
    loginError.classList.add('hidden');
    toast('Password updated. Please sign in with your new password.', 'success');
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.textContent = 'Update Password';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  ACCESS_TOKEN = '';
  sessionStorage.removeItem('roam_admin_token');
  adminPanel.classList.add('hidden');
  loginScreen.classList.remove('hidden');
});

function showPanel() {
  loginScreen.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  loadProducts();
  loadProjects();
  loadSubscribers();
}

// On page load: verify the stored token is still valid AND belongs to the admin
// before ever showing the panel — prevents stale or foreign tokens from bypassing
// the login screen.
if (ACCESS_TOKEN) {
  (async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${ACCESS_TOKEN}` },
      });
      const json = await res.json();
      if (!res.ok || json.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        throw new Error('Unauthorised');
      }
      showPanel();
    } catch {
      ACCESS_TOKEN = '';
      sessionStorage.removeItem('roam_admin_token');
      loginScreen.classList.remove('hidden');
    }
  })();
}

/* ── Tabs ─────────────────────────────────────────────────── */
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
  });
});

/* ── Category display helpers ────────────────────────────── */
const CATEGORY_LABEL = { panel: 'Solar Panel', inverter: 'Inverter', battery: 'Battery' };
const CATEGORY_BADGE = { panel: 'adm-badge-panel', inverter: 'adm-badge-inverter', battery: 'adm-badge-battery' };
const TYPE_LABEL     = { 'grid-tied': 'Grid-Tied', 'off-grid': 'Off-Grid', 'hybrid': 'Hybrid' };
const TYPE_BADGE     = { 'grid-tied': 'adm-badge-gridtied', 'off-grid': 'adm-badge-offgrid', 'hybrid': 'adm-badge-hybrid' };

function imgThumb(url) {
  if (!url) return '<div class="adm-img-thumb" style="background:#222;"></div>';
  const firstUrl = url.split(',')[0].trim();
  return `<img class="adm-img-thumb" src="${firstUrl}" alt="" loading="lazy" onerror="this.style.display='none'">`;
}

function skeletonRows(cols, n = 3) {
  return Array.from({ length: n }, () =>
    `<tr class="skeleton-row">${Array.from({ length: cols }, () =>
      `<td><div><div class="skeleton" style="width:${60 + Math.random() * 30}%"></div></div></td>`
    ).join('')}</tr>`
  ).join('');
}

/* ═══ PRODUCTS ══════════════════════════════════════════════ */
let allProducts = [];

async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  tbody.innerHTML = skeletonRows(7);
  try {
    allProducts = await apiGet('products');
    renderProductsTable();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>${e.message}</p></div></td></tr>`;
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('products-tbody');
  const count = document.getElementById('products-count');
  count.textContent = `(${allProducts.length})`;

  if (!allProducts.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-solar-panel"></i><p>No products yet. Add one!</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = allProducts.map(p => `
    <tr>
      <td>${imgThumb(p.image_url)}</td>
      <td style="font-family:monospace;font-size:0.8rem;color:var(--adm-muted)">${p.sku}</td>
      <td style="font-weight:600;">${p.name}</td>
      <td class="hide-mobile"><span class="adm-badge ${CATEGORY_BADGE[p.category] || ''}">${CATEGORY_LABEL[p.category] || p.category}</span></td>
      <td>KES ${Number(p.price).toLocaleString()}</td>
      <td class="hide-mobile"><span class="adm-badge ${p.active ? 'adm-badge-active' : 'adm-badge-inactive'}">${p.active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn btn-ghost btn-sm" onclick="editProduct('${p.id}')"><i class="fas fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('products','${p.id}','${p.name.replace(/'/g,"\\'")}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

/* Product form */
const productModal     = document.getElementById('product-modal');
const productForm      = document.getElementById('product-form');
const productModalTitle= document.getElementById('product-modal-title');

function openProductModal(title) {
  productModalTitle.textContent = title;
  productModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeProductModal() {
  productModal.classList.add('hidden');
  productForm.reset();
  document.getElementById('pf-id').value = '';
  document.getElementById('pf-active').checked = true;
  document.body.style.overflow = '';
}

document.getElementById('add-product-btn').addEventListener('click', () => openProductModal('Add Product'));
document.getElementById('product-modal-close').addEventListener('click', closeProductModal);
document.getElementById('product-cancel-btn').addEventListener('click', closeProductModal);

window.editProduct = function(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('pf-id').value       = p.id;
  document.getElementById('pf-sku').value      = p.sku;
  document.getElementById('pf-brand').value    = p.brand;
  document.getElementById('pf-name').value     = p.name;
  document.getElementById('pf-category').value = p.category;
  document.getElementById('pf-price').value    = p.price;
  document.getElementById('pf-range').value    = p.range_label || '';
  document.getElementById('pf-sort').value     = p.sort_order || 0;
  document.getElementById('pf-image').value    = p.image_url || '';
  document.getElementById('pf-desc').value     = p.description || '';
  document.getElementById('pf-specs').value    = (p.specs || []).join('\n');
  document.getElementById('pf-active').checked = !!p.active;
  openProductModal('Edit Product');
};

productForm.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('product-save-btn');
  btn.disabled = true; btn.textContent = 'Saving…';

  const id = document.getElementById('pf-id').value;
  const specsRaw = document.getElementById('pf-specs').value;
  const specs = specsRaw.split('\n').map(s => s.trim()).filter(Boolean);

  const data = {
    sku:         document.getElementById('pf-sku').value.trim(),
    brand:       document.getElementById('pf-brand').value.trim(),
    name:        document.getElementById('pf-name').value.trim(),
    category:    document.getElementById('pf-category').value,
    price:       parseFloat(document.getElementById('pf-price').value),
    range_label: document.getElementById('pf-range').value.trim() || null,
    sort_order:  parseInt(document.getElementById('pf-sort').value || '0', 10),
    image_url:   document.getElementById('pf-image').value.trim() || null,
    description: document.getElementById('pf-desc').value.trim() || null,
    specs,
    active:      document.getElementById('pf-active').checked,
  };

  try {
    if (id) {
      await apiPost({ table: 'products', action: 'update', id, data });
      toast('Product updated!', 'success');
    } else {
      await apiPost({ table: 'products', action: 'insert', data });
      toast('Product added!', 'success');
    }
    closeProductModal();
    await loadProducts();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Product';
  }
});

/* ═══ PROJECTS ══════════════════════════════════════════════ */
let allProjects = [];

async function loadProjects() {
  const tbody = document.getElementById('projects-tbody');
  tbody.innerHTML = skeletonRows(7);
  try {
    allProjects = await apiGet('projects');
    renderProjectsTable();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>${e.message}</p></div></td></tr>`;
  }
}

function renderProjectsTable() {
  const tbody = document.getElementById('projects-tbody');
  const count = document.getElementById('projects-count');
  count.textContent = `(${allProjects.length})`;

  if (!allProjects.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-building"></i><p>No projects yet. Add one!</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = allProjects.map(p => `
    <tr>
      <td>${imgThumb(p.image_url)}</td>
      <td style="font-weight:600;">${p.title}</td>
      <td class="hide-mobile" style="color:var(--adm-muted);font-size:0.85rem;">${p.location}</td>
      <td><span class="adm-badge ${TYPE_BADGE[p.type] || ''}">${TYPE_LABEL[p.type] || p.type}</span></td>
      <td class="hide-mobile">${p.size_kwp ? p.size_kwp + ' kWp' : 'N/A'}</td>
      <td class="hide-mobile"><span class="adm-badge ${p.active ? 'adm-badge-active' : 'adm-badge-inactive'}">${p.active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn btn-ghost btn-sm" onclick="editProject('${p.id}')"><i class="fas fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('projects','${p.id}','${p.title.replace(/'/g,"\\'")}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

/* Project form */
const projectModal      = document.getElementById('project-modal');
const projectForm       = document.getElementById('project-form');
const projectModalTitle = document.getElementById('project-modal-title');

function openProjectModal(title) {
  projectModalTitle.textContent = title;
  projectModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeProjectModal() {
  projectModal.classList.add('hidden');
  projectForm.reset();
  document.getElementById('proj-id').value = '';
  document.getElementById('proj-active').checked = true;
  document.getElementById('proj-featured').checked = false;
  document.body.style.overflow = '';
}

document.getElementById('add-project-btn').addEventListener('click', () => openProjectModal('Add Project'));
document.getElementById('project-modal-close').addEventListener('click', closeProjectModal);
document.getElementById('project-cancel-btn').addEventListener('click', closeProjectModal);

window.editProject = function(id) {
  const p = allProjects.find(x => x.id === id);
  if (!p) return;
  document.getElementById('proj-id').value       = p.id;
  document.getElementById('proj-title').value    = p.title;
  document.getElementById('proj-location').value = p.location;
  document.getElementById('proj-type').value     = p.type;
  document.getElementById('proj-size').value     = p.size_kwp || '';
  document.getElementById('proj-storage').value  = p.storage_kwh || '';
  document.getElementById('proj-date').value     = p.completed_at ? p.completed_at.substring(0,10) : '';
  document.getElementById('proj-sort').value     = p.sort_order || 0;
  document.getElementById('proj-image').value    = p.image_url || '';
  document.getElementById('proj-desc').value     = p.description || '';
  document.getElementById('proj-featured').checked = !!p.featured;
  document.getElementById('proj-active').checked   = !!p.active;
  openProjectModal('Edit Project');
};

projectForm.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('project-save-btn');
  btn.disabled = true; btn.textContent = 'Saving…';

  const id = document.getElementById('proj-id').value;
  const data = {
    title:        document.getElementById('proj-title').value.trim(),
    location:     document.getElementById('proj-location').value.trim(),
    type:         document.getElementById('proj-type').value,
    size_kwp:     parseFloat(document.getElementById('proj-size').value) || null,
    storage_kwh:  parseFloat(document.getElementById('proj-storage').value) || null,
    completed_at: document.getElementById('proj-date').value || null,
    sort_order:   parseInt(document.getElementById('proj-sort').value || '0', 10),
    image_url:    document.getElementById('proj-image').value.trim() || null,
    description:  document.getElementById('proj-desc').value.trim() || null,
    featured:     document.getElementById('proj-featured').checked,
    active:       document.getElementById('proj-active').checked,
  };

  try {
    if (id) {
      await apiPost({ table: 'projects', action: 'update', id, data });
      toast('Project updated!', 'success');
    } else {
      await apiPost({ table: 'projects', action: 'insert', data });
      toast('Project added!', 'success');
    }
    closeProjectModal();
    await loadProjects();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Project';
  }
});

/* ═══ CONFIRM DELETE ════════════════════════════════════════ */
let pendingDelete = null;

window.confirmDelete = function(table, id, name) {
  pendingDelete = { table, id };
  document.getElementById('confirm-text').textContent = `"${name}" will be permanently removed.`;
  document.getElementById('confirm-modal').classList.remove('hidden');
};

document.getElementById('confirm-cancel').addEventListener('click', () => {
  pendingDelete = null;
  document.getElementById('confirm-modal').classList.add('hidden');
});

document.getElementById('confirm-delete').addEventListener('click', async () => {
  if (!pendingDelete) return;
  const btn = document.getElementById('confirm-delete');
  btn.disabled = true; btn.textContent = 'Deleting…';
  try {
    await apiPost({ table: pendingDelete.table, action: 'delete', id: pendingDelete.id });
    toast('Deleted!', 'success');
    if (pendingDelete.table === 'products') await loadProducts();
    else if (pendingDelete.table === 'projects') await loadProjects();
    else if (pendingDelete.table === 'subscribers') await loadSubscribers();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Delete';
    pendingDelete = null;
    document.getElementById('confirm-modal').classList.add('hidden');
  }
});

/* Close modals on overlay click */
productModal.addEventListener('click', e => { if (e.target === productModal) closeProductModal(); });
projectModal.addEventListener('click', e => { if (e.target === projectModal) closeProjectModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeProductModal();
    closeProjectModal();
    if (typeof closeSubscriberModal === 'function') closeSubscriberModal();
    if (typeof closeNewsletterModal === 'function') closeNewsletterModal();
    pendingDelete = null;
    document.getElementById('confirm-modal').classList.add('hidden');
  }
});

/* ═══ SUBSCRIBERS ════════════════════════════════════════════ */
let allSubscribers = [];

async function loadSubscribers() {
  const tbody = document.getElementById('subscribers-tbody');
  const countEl = document.getElementById('subscribers-count');
  if (tbody) tbody.innerHTML = skeletonRows(3);
  try {
    allSubscribers = await apiGet('subscribers');
    if (countEl) countEl.textContent = `(${allSubscribers.length})`;
    renderSubscribersTable();
  } catch (e) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>${e.message}</p></div></td></tr>`;
    }
  }
}

function renderSubscribersTable() {
  const tbody = document.getElementById('subscribers-tbody');
  if (!tbody) return;
  if (allSubscribers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state"><i class="fas fa-envelope"></i><p>No newsletter subscribers found.</p></div></td></tr>`;
    return;
  }
  
  tbody.innerHTML = allSubscribers.map(s => {
    const dateStr = s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'N/A';
    
    return `
      <tr>
        <td style="font-weight: 600;">${s.email}</td>
        <td>${dateStr}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="confirmDelete('subscribers', '${s.id}', '${s.email}')" style="color:#ef4444; border-color:#fca5a5; background:transparent;">
            <i class="fas fa-trash-alt"></i> Unsubscribe
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function exportSubscribersCSV() {
  if (allSubscribers.length === 0) {
    toast('No subscribers to export', 'error');
    return;
  }
  
  let csv = 'Email,Signup Date\n';
  allSubscribers.forEach(s => {
    const dateStr = s.created_at ? new Date(s.created_at).toISOString() : '';
    csv += `"${s.email.replace(/"/g, '""')}",${dateStr}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Roam_Energy_Subscribers_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast('CSV exported!', 'success');
}

document.getElementById('export-subscribers-btn').addEventListener('click', exportSubscribersCSV);

/* ── Add Subscriber & Newsletter Broadcast Modals ─────────── */
const subscriberModal = document.getElementById('subscriber-modal');
const subscriberForm  = document.getElementById('subscriber-form');
const newsletterModal = document.getElementById('newsletter-modal');
const newsletterForm  = document.getElementById('newsletter-form');

function openSubscriberModal() {
  subscriberModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

window.closeSubscriberModal = function() {
  subscriberModal.classList.add('hidden');
  subscriberForm.reset();
  document.body.style.overflow = '';
};

function openNewsletterModal() {
  newsletterModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

window.closeNewsletterModal = function() {
  newsletterModal.classList.add('hidden');
  newsletterForm.reset();
  document.getElementById('newsletter-status-box').classList.add('hidden');
  document.body.style.overflow = '';
};

// Wire open buttons
document.getElementById('add-subscriber-btn').addEventListener('click', openSubscriberModal);
document.getElementById('compose-newsletter-btn').addEventListener('click', openNewsletterModal);

// Wire close buttons
document.getElementById('subscriber-modal-close').addEventListener('click', closeSubscriberModal);
document.getElementById('subscriber-cancel-btn').addEventListener('click', closeSubscriberModal);
document.getElementById('newsletter-modal-close').addEventListener('click', closeNewsletterModal);
document.getElementById('newsletter-cancel-btn').addEventListener('click', closeNewsletterModal);

// Click outside close
subscriberModal.addEventListener('click', e => { if (e.target === subscriberModal) closeSubscriberModal(); });
newsletterModal.addEventListener('click', e => { if (e.target === newsletterModal) closeNewsletterModal(); });

// Submit subscriber
subscriberForm.addEventListener('submit', async e => {
  e.preventDefault();
  const emailInput = document.getElementById('sub-email');
  const email = emailInput ? emailInput.value.trim() : '';
  if (!email) return;

  const btn = document.getElementById('subscriber-save-btn');
  btn.disabled = true; btn.textContent = 'Adding…';

  try {
    await apiPost({
      table: 'subscribers',
      action: 'insert',
      data: { email }
    });
    toast('Subscriber added successfully!', 'success');
    closeSubscriberModal();
    await loadSubscribers();
  } catch (err) {
    let msg = err.message || 'Failed to add subscriber';
    if (msg.includes('duplicate') || msg.includes('unique')) {
      msg = 'This email is already subscribed!';
    }
    toast(msg, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Add Subscriber';
  }
});

// Submit newsletter broadcast
newsletterForm.addEventListener('submit', async e => {
  e.preventDefault();
  const subject = document.getElementById('news-subject').value.trim();
  const title   = document.getElementById('news-title').value.trim();
  const content = document.getElementById('news-content').value.trim();

  if (!subject || !content) {
    toast('Subject and Content are required.', 'error');
    return;
  }

  const btn       = document.getElementById('newsletter-send-btn');
  const cancelBtn = document.getElementById('newsletter-cancel-btn');
  const statusBox = document.getElementById('newsletter-status-box');
  const statusText = document.getElementById('newsletter-status-text');

  // Disable UI
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sending…';
  cancelBtn.disabled = true;
  statusBox.classList.remove('hidden');
  statusText.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Querying subscribers and sending emails...';

  try {
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({ subject, title, content })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to dispatch newsletter');
    }

    toast(data.message || 'Broadcast completed successfully!', 'success');
    closeNewsletterModal();
    await loadSubscribers(); // Reload to count any updates
  } catch (err) {
    toast(err.message, 'error');
    statusBox.classList.add('hidden');
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Broadcast';
    cancelBtn.disabled = false;
  }
});
