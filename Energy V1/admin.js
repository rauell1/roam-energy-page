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

    if (json.user?.email !== ADMIN_EMAIL) {
      throw new Error('Access denied. Unauthorised account.');
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
}

if (ACCESS_TOKEN) showPanel();

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
  return `<img class="adm-img-thumb" src="${url}" alt="" loading="lazy" onerror="this.style.display='none'">`;
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
    else await loadProjects();
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
    pendingDelete = null;
    document.getElementById('confirm-modal').classList.add('hidden');
  }
});
