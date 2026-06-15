// ─── Supabase config (anon / public key — safe for frontend) ──
const SUPABASE_URL      = 'https://akbmydsqorsoijxsmwrh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYm15ZHNxb3Jzb2lqeHNtd3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzgyNDMsImV4cCI6MjA5NDYxNDI0M30.7zqrrNdn4golHcw9IFhFZemxfu0NGzdhqHPdflxSbSU';

// ─── Product Catalogue (loaded from Supabase on boot) ──────
let PRODUCTS = [];

function transformProduct(row) {
  return {
    id:          row.sku,
    brand:       row.brand,
    name:        row.name,
    category:    row.category,
    price:       parseFloat(row.price),
    image:       row.image_url || '',
    description: row.description || '',
    specs:       Array.isArray(row.specs) ? row.specs : [],
    rangeLabel:  row.range_label || '',
  };
}

async function fetchProducts() {
  const url = `${SUPABASE_URL}/rest/v1/products?select=*&active=eq.true&order=sort_order.asc`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  if (!res.ok) throw new Error('Failed to load products');
  const rows = await res.json();
  return rows.map(transformProduct);
}

let ORDER_CURRENCY = 'KES';
const KES_USD_RATE = 130.0;

// ─── State ─────────────────────────────────────────────────────────────────
const cart = {};
let activeCategory = 'All';

// ─── DOM refs ──────────────────────────────────────────────────────────────
const grid            = document.getElementById('productsGrid');
const searchInput     = document.getElementById('searchInput');
const sortSelect      = document.getElementById('sortSelect');
const resultsCount    = document.getElementById('resultsCount');
const openCartBtn     = document.getElementById('openCartBtn');
const closeCartBtn    = document.getElementById('closeCartBtn');
const cartOverlay     = document.getElementById('cartDrawerOverlay');
const cartDrawerEl    = document.getElementById('cartDrawer');
const cartItemsEl     = document.getElementById('cartItems');
const cartTotalEl     = document.getElementById('cartTotal');
const floatingCount   = document.getElementById('floatingCount');
let   checkoutBtn     = document.getElementById('checkoutBtn');
const modalOverlay    = document.getElementById('productModalOverlay');
const modalWrap       = document.getElementById('productModal');
const modalBodyEl     = document.getElementById('modalBody');
const closeModalBtn   = document.getElementById('closeModalBtn');

const checkoutConfig  = window.checkoutConfig || {};
const API_ENDPOINT    = checkoutConfig.endpoint || '/api/checkout';
const API_ACCESS_TOKEN = checkoutConfig.apiKey || (document.querySelector('meta[name="roam-api-key"]')?.content || '');

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatPrice(n) {
  if (ORDER_CURRENCY === 'USD') {
    const usdVal = n / KES_USD_RATE;
    return '$ ' + usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return 'KES ' + n.toLocaleString('en-KE');
}
function cartCount() {
  return Object.values(cart).reduce((s, q) => s + q, 0);
}
function cartTotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
}

// ─── Toast ─────────────────────────────────────────────────────────────────
function showToast(message, type = '') {
  let toast = document.getElementById('roam-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'roam-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast${type ? ' ' + type : ''}`;
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── Grid rendering ────────────────────────────────────────────────────────
function filteredProducts() {
  const q    = searchInput.value.toLowerCase();
  const sort = sortSelect.value;

  let list = PRODUCTS.filter(p => {
    const matchCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchQ     = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchCategory && matchQ;
  });

  if (sort === 'low')  list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
  return list;
}

function renderGrid() {
  const products = filteredProducts();
  grid.innerHTML = '';

  if (resultsCount) {
    resultsCount.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;
  }

  if (!products.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--clr-muted);">
        <i class="fas fa-search" style="font-size:2rem;opacity:.3;display:block;margin-bottom:12px;"></i>
        <p>No products match your search.</p>
      </div>`;
    return;
  }

  products.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${i * 60}ms`;

    card.innerHTML = `
      <div class="product-card-image" data-open="${p.id}">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="product-card-image-overlay">
          <i class="fas fa-expand-alt"></i>
        </div>
      </div>
      <div class="product-card-body">
        <p class="product-card-brand">${p.brand} · ${p.category}</p>
        <h3 data-open="${p.id}">${p.name}</h3>
        <p class="product-card-subtitle">${p.specs.slice(0,2).join(' · ')}</p>
        <p class="product-card-desc">${p.description}</p>
        <p class="product-card-price">${formatPrice(p.price)} <span>per unit</span></p>
        <div class="product-card-actions">
          <button class="btn btn-outline-primary btn-sm" data-open="${p.id}">Details</button>
          <button class="btn btn-primary btn-sm" data-add="${p.id}">
            <i class="fas fa-cart-plus"></i> Add
          </button>
        </div>
      </div>`;

    grid.appendChild(card);
  });

  grid.querySelectorAll('[data-open]').forEach(el => {
    el.addEventListener('click', () => openModal(el.dataset.open));
  });
  grid.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.dataset.add);
    });
  });
}

// ─── Cart ──────────────────────────────────────────────────────────────────
function addToCart(id) {
  const p = PRODUCTS.find(p => p.id === id);
  cart[id] = (cart[id] || 0) + 1;
  updateCartUI();
  openCart();
  if (p) showToast(`${p.name.split(' ').slice(0,3).join(' ')} added to cart`, 'success');
}

function removeFromCart(id) {
  delete cart[id];
  updateCartUI();
}

function setQuantity(id, qty) {
  qty = parseInt(qty, 10);
  if (!qty || qty < 1) { removeFromCart(id); return; }
  cart[id] = qty;
  updateCartUI();
}

function updateCartUI() {
  const count = cartCount();
  floatingCount.textContent = count;

  cartTotalEl.textContent = formatPrice(cartTotal());

  if (!count) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-cart"></i>
        <p>Your cart is empty.<br>Browse products and add items.</p>
      </div>`;
    return;
  }

  cartItemsEl.innerHTML = '';
  Object.entries(cart).forEach(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    if (!p) return;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="cart-item-info">
        <p class="cart-item-name">${p.name}</p>
        <p class="cart-item-price">${formatPrice(p.price)} each</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" data-dec="${id}"><i class="fas fa-minus"></i></button>
        <span class="qty-value">${qty}</span>
        <button class="qty-btn" data-inc="${id}"><i class="fas fa-plus"></i></button>
        <button class="remove-btn" data-remove="${id}"><i class="fas fa-trash"></i></button>
      </div>`;

    cartItemsEl.appendChild(row);
  });

  cartItemsEl.querySelectorAll('[data-inc]').forEach(btn => {
    btn.addEventListener('click', () => setQuantity(btn.dataset.inc, (cart[btn.dataset.inc] || 0) + 1));
  });
  cartItemsEl.querySelectorAll('[data-dec]').forEach(btn => {
    btn.addEventListener('click', () => setQuantity(btn.dataset.dec, (cart[btn.dataset.dec] || 1) - 1));
  });
  cartItemsEl.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.remove));
  });
}

function prefillCheckout() {
  const user = window.raeAuth?.getUser?.();
  if (!user) return;
  const nameEl  = document.getElementById('customerName');
  const emailEl = document.getElementById('customerEmail');
  const phoneEl = document.getElementById('customerPhone');
  if (nameEl)  nameEl.value  = user.full_name || nameEl.value || '';
  if (emailEl) emailEl.value = user.email     || emailEl.value || '';
  if (phoneEl) phoneEl.value = user.phone     || phoneEl.value || '';
}

function updateCartAuthState() {
  const loggedIn = window.raeAuth?.isLoggedIn?.() || false;
  const gate = document.getElementById('cart-auth-gate');
  const form = document.getElementById('cart-checkout-form');
  if (!gate || !form) return;
  gate.classList.toggle('hidden', loggedIn);
  form.classList.toggle('hidden', !loggedIn);
  if (loggedIn) {
    prefillCheckout();
    const user = window.raeAuth?.getUser?.();
    const label = document.getElementById('cart-user-label');
    if (label && user) label.textContent = user.full_name || user.email || 'Account';
  }
}

function openCart() {
  cartDrawerEl.classList.remove('drawer-closed');
  cartDrawerEl.classList.add('drawer-open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  updateCartAuthState();
}

function closeCart() {
  cartDrawerEl.classList.remove('drawer-open');
  cartDrawerEl.classList.add('drawer-closed');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// ─── Filter chips ──────────────────────────────────────────────────────────
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    activeCategory = chip.dataset.category;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip-active'));
    chip.classList.add('chip-active');
    renderGrid();
  });
});

// ─── Product Modal ─────────────────────────────────────────────────────────
function openModal(id) {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p) return;

  const specsHtml = p.specs.map(s => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--clr-border);font-size:0.96rem;">
      <i class="fas fa-check-circle" style="color:var(--clr-primary);font-size:1.05rem;margin-top:2px;flex-shrink:0;"></i>
      <span style="color:var(--clr-body);line-height:1.4;">${s}</span>
    </div>`).join('');

  modalBodyEl.innerHTML = `
    <div class="modal-product-image">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
    </div>
    <div class="modal-product-body">
      <p class="modal-product-brand">${p.brand} · ${p.category}</p>
      <h3 class="modal-product-title">${p.name}</h3>
      <p class="modal-product-desc">${p.description}</p>
      <div style="margin-bottom:24px;">${specsHtml}</div>
      <p class="modal-product-price">${formatPrice(p.price)}</p>
      <div class="modal-actions">
        <button class="btn btn-outline-primary btn-md" id="modal-details-close">Close</button>
        <button class="btn btn-primary btn-md" data-add="${p.id}">
          <i class="fas fa-cart-plus"></i> Add to Cart
        </button>
      </div>
    </div>`;

  modalBodyEl.querySelector('[data-add]').addEventListener('click', () => {
    addToCart(id);
    closeModal();
  });
  modalBodyEl.querySelector('#modal-details-close').addEventListener('click', closeModal);

  modalOverlay.classList.add('open');
  modalWrap.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  modalWrap.classList.remove('open');
  document.body.style.overflow = '';
}

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeCart(); } });

// Auth gate buttons in cart
document.getElementById('cart-signin-btn')?.addEventListener('click', () => {
  window.raeAuth?.openModal('in');
});
document.getElementById('cart-signup-btn')?.addEventListener('click', () => {
  window.raeAuth?.openModal('up');
});
document.getElementById('cart-edit-account-btn')?.addEventListener('click', () => {
  window.raeAuth?.openModal();
});

// Currency segmented toggle control
document.querySelectorAll('.currency-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.currency-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    ORDER_CURRENCY = tab.dataset.currency;
    updateCartUI();
    renderGrid();
  });
});

// Update cart auth state when user signs in/out/updates profile
document.addEventListener('rae:auth', e => {
  const { type } = e.detail;
  updateCartAuthState();
  if (type === 'signed-out') {
    // Clear prefilled fields on sign out
    ['customerName','customerEmail','customerPhone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }
});

// ─── PDF generation ────────────────────────────────────────────────────────
async function generateInvoice(customerDetails, orderReference) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const LEFT_MARGIN  = 20;
  const RIGHT_END    = 195;
  const PAGE_WIDTH   = 210;
  const PAGE_HEIGHT  = 297;

  // Sanitize customer details
  const safeName  = (customerDetails.name  || 'Walk-in Client').trim();
  const safeEmail = (customerDetails.email || 'N/A').trim();
  const safePhone = (customerDetails.phone || 'N/A').trim().replace(/^'+/, '');

  const d = new Date();
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const dateStr = `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  // ── 1. LOGO ──────────────────────────────────────────────────────────────
  try {
    const imgData = await loadImageAsDataUrl('logos/wordmarks/ROAM_LOGO_2024-01.png');
    doc.addImage(imgData, 'PNG', LEFT_MARGIN, 10, 38, 14);
  } catch (_) {
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(244, 121, 32);
    doc.text('ROAM', LEFT_MARGIN, 22);
  }

  // ── 2. TITLE (top-right) ──────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Proforma Invoice', RIGHT_END, 18, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(dateStr,     RIGHT_END, 25, { align: 'right' });
  doc.text('Page 1 / 1', RIGHT_END, 30, { align: 'right' });

  // ── 3. TOP HORIZONTAL RULE ────────────────────────────────────────────────
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.line(LEFT_MARGIN, 36, RIGHT_END, 36);

  // ── 4. BILL TO (left) & COMPANY (right) ──────────────────────────────────
  let y = 42;
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.setFont(undefined, 'bold');
  doc.text('BILL TO', LEFT_MARGIN, y);
  doc.text('ROAM ELECTRIC LIMITED', RIGHT_END, y, { align: 'right' });

  y += 5;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(safeName, LEFT_MARGIN, y);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(50, 50, 50);

  const companyLines = [
    'National Park East Gate Rd.',
    'P.O. Box 18284, Nairobi 00500',
    'Kenya',
    'Tel: +254 740 666 555',
    'info@roam-electric.com',
  ];
  companyLines.forEach((line, i) => {
    doc.text(line, RIGHT_END, y + i * 4.8, { align: 'right' });
  });

  doc.setFontSize(9);
  doc.text(`Phone: ${safePhone}`, LEFT_MARGIN, y + 5);
  doc.text(`Email: ${safeEmail}`, LEFT_MARGIN, y + 10);

  // ── 5. SECOND HORIZONTAL RULE ────────────────────────────────────────────
  y = 78;
  doc.setDrawColor(180, 180, 180);
  doc.line(LEFT_MARGIN, y, RIGHT_END, y);

  // ── 6. METADATA TABLE (two columns) ──────────────────────────────────────
  y = 84;
  const leftMeta = [
    ['Document No.',         orderReference],
    ['VAT Registration No.', 'P05170428D'],
    ['Document Date',        dateStr],
    ['Currency',             ORDER_CURRENCY],
    ['Salesperson',          'Roy Otieno'],
  ];
  const rightMeta = [
    ['Email',          'info@roam-electric.com'],
    ['Home Page',      'www.roam-electric.com'],
    ['Phone No.',      '+254 740 666 555'],
    ['Mpesa Till No.', '9572270'],
    ['Bank',           'Standard Chartered'],
    ['Account No.',    '0102487879100 (KES)'],
    ['Account No.',    '8702487879100 (USD)'],
    ['Branch',         'Industrial Area 053'],
    ['SWIFT Code',     'SCBLKENXXXX'],
  ];

  doc.setFontSize(8.5);
  leftMeta.forEach(([label, val], i) => {
    doc.setFont(undefined, 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(label, LEFT_MARGIN, y + i * 5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(String(val), LEFT_MARGIN + 42, y + i * 5);
  });
  rightMeta.forEach(([label, val], i) => {
    doc.setFont(undefined, 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(label, 108, y + i * 5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(val, RIGHT_END, y + i * 5, { align: 'right' });
  });

  // ── 7. ITEM TABLE HEADER (dark background) ───────────────────────────────
  const COL = { Item: 62, Qty: 14, Price: 26, HS: 15, VATpct: 12, VATAmt: 22, Amt: 24 };
  const colX = {
    Item:   LEFT_MARGIN,
    Qty:    LEFT_MARGIN + COL.Item,
    Price:  LEFT_MARGIN + COL.Item + COL.Qty,
    HS:     LEFT_MARGIN + COL.Item + COL.Qty + COL.Price,
    VATpct: LEFT_MARGIN + COL.Item + COL.Qty + COL.Price + COL.HS,
    VATAmt: LEFT_MARGIN + COL.Item + COL.Qty + COL.Price + COL.HS + COL.VATpct,
    Amt:    RIGHT_END,
  };

  y = 133;
  const ROW_H = 7;
  // Header background bar
  doc.setFillColor(20, 110, 245);   // Roam blue
  doc.rect(LEFT_MARGIN, y - ROW_H + 1, RIGHT_END - LEFT_MARGIN, ROW_H, 'F');

  doc.setFont(undefined, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Item',       colX.Item + 1,                    y - 1);
  doc.text('Qty',        colX.Qty   + COL.Qty   / 2,       y - 1, { align: 'center' });
  doc.text('Unit Price', colX.Price + COL.Price,            y - 1, { align: 'right' });
  doc.text('HS Code',    colX.HS    + COL.HS    / 2,       y - 1, { align: 'center' });
  doc.text('VAT%',       colX.VATpct+ COL.VATpct/ 2,       y - 1, { align: 'center' });
  doc.text('VAT Amt',    colX.VATAmt+ COL.VATAmt,           y - 1, { align: 'right' });
  doc.text('Amount',     colX.Amt,                          y - 1, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  y += 3;

  // ── 8. ITEM ROWS ──────────────────────────────────────────────────────────
  let grandTotal = 0;
  let rowIndex   = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    const p = PRODUCTS.find(product => product.id === id);
    if (!p) return;
    const price     = ORDER_CURRENCY === 'USD' ? Math.round((p.price / KES_USD_RATE) * 100) / 100 : p.price;
    const lineTotal = price * qty;
    grandTotal     += lineTotal;

    // Alternating row shading
    const nameLines = doc.splitTextToSize(p.name, COL.Item - 3);
    const rowHeight = Math.max(nameLines.length * 5, 6) + 3;
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 247, 252);
      doc.rect(LEFT_MARGIN, y - 3, RIGHT_END - LEFT_MARGIN, rowHeight, 'F');
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(10, 10, 10);
    doc.text(nameLines, colX.Item + 1, y);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(String(qty),           colX.Qty    + COL.Qty   / 2,  y, { align: 'center' });
    doc.text(formatAmt(price),      colX.Price  + COL.Price,       y, { align: 'right' });
    doc.text('-',                   colX.HS     + COL.HS    / 2,  y, { align: 'center' });
    doc.text('0%',                  colX.VATpct + COL.VATpct/ 2,  y, { align: 'center' });
    doc.text('0.00',                colX.VATAmt + COL.VATAmt,      y, { align: 'right' });
    doc.text(formatAmt(lineTotal),  colX.Amt,                      y, { align: 'right' });

    y += rowHeight;
    rowIndex++;
  });

  // ── 9. TOTALS ─────────────────────────────────────────────────────────────
  y += 4;
  doc.setDrawColor(180, 180, 180);
  doc.line(LEFT_MARGIN, y - 2, RIGHT_END, y - 2);

  const TOT_LABEL_X = RIGHT_END - 68;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const drawTotalRow = (label, value, bold) => {
    doc.setFont(undefined, bold ? 'bold' : 'normal');
    doc.text(label,  TOT_LABEL_X, y);
    doc.text(value,  RIGHT_END,   y, { align: 'right' });
    y += 6;
  };
  drawTotalRow('Sub-Total',       formatAmt(grandTotal), false);
  drawTotalRow('VAT (0%)',        '0.00',                 false);
  doc.setDrawColor(20, 110, 245);
  doc.setLineWidth(0.6);
  doc.line(TOT_LABEL_X, y - 2, RIGHT_END, y - 2);
  doc.setLineWidth(0.4);
  doc.setDrawColor(0);
  drawTotalRow(`Total (${ORDER_CURRENCY})`, formatAmt(grandTotal), true);

  // ── 10. FOOTER NOTE ───────────────────────────────────────────────────────
  const footerY = PAGE_HEIGHT - 18;
  doc.setDrawColor(200, 200, 200);
  doc.line(LEFT_MARGIN, footerY - 3, RIGHT_END, footerY - 3);
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.setFont(undefined, 'italic');
  doc.text(
    'This proforma invoice is valid for 30 days. Prices exclude VAT and installation unless stated. Payment terms: 100% upfront.',
    PAGE_WIDTH / 2, footerY, { align: 'center' }
  );
  doc.text(
    'Roam Electric Limited · VAT Reg: P05170428D · www.roam-electric.com · energy@roam-electric.com',
    PAGE_WIDTH / 2, footerY + 5, { align: 'center' }
  );

  const filename = `Roam-ProForma-Invoice-${orderReference}.pdf`;
  const blob = doc.output('blob');
  return { blob, filename, total: grandTotal };
}

// ─── Utilities ─────────────────────────────────────────────────────────────
function downloadInvoice(blob, filename) {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImageAsDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

function formatAmt(n) {
  return n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateOrderReference() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RE-${ts}-${rand}`;
}

function persistOrderLocally({ customer, entries, orderReference, total }) {
  try {
    sessionStorage.setItem('roamLastOrder', JSON.stringify({
      customer, entries, orderReference, currency: ORDER_CURRENCY, total,
      savedAt: new Date().toISOString(),
    }));
  } catch (_) {}
}

// ─── Checkout ──────────────────────────────────────────────────────────────
let customerDetails, cartEntries, orderReference, invoice;

checkoutBtn.addEventListener('click', async () => {
  if (!window.raeAuth?.isLoggedIn?.()) {
    window.raeAuth?.openModal('up');
    return;
  }

  const name  = document.getElementById('customerName').value.trim();
  const email = document.getElementById('customerEmail').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();

  if (!cartCount()) { showToast('Your cart is empty.', 'error'); return; }
  if (!name || !email || !phone) {
    showToast('Please fill in your name, email, and phone.', 'error');
    return;
  }

  const origHTML   = checkoutBtn.innerHTML;
  checkoutBtn.innerHTML  = '<i class="fas fa-spinner fa-spin"></i> Sending…';
  checkoutBtn.disabled   = true;

  customerDetails = { name, email, phone };
  cartEntries     = Object.entries(cart).map(([id, qty]) => ({
    id, qty, price: PRODUCTS.find(p => p.id === id)?.price,
    name: PRODUCTS.find(p => p.id === id)?.name,
  }));
  orderReference  = generateOrderReference();

  try {
    if (window.raeAuth?.isLoggedIn?.() && typeof window.raeAuth.updateProfile === 'function') {
      await window.raeAuth.updateProfile(name, phone).catch(err => {
        console.warn('Failed to auto-update profile on checkout:', err);
      });
    }

    invoice        = await generateInvoice(customerDetails, orderReference);
    invoice.base64 = await blobToDataUrl(invoice.blob);
    downloadInvoice(invoice.blob, invoice.filename);

    const headers = { 'Content-Type': 'application/json' };
    if (API_ACCESS_TOKEN) headers['x-api-key'] = API_ACCESS_TOKEN;

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user: customerDetails,
        cart: cartEntries,
        orderReference,
        filename:    invoice.filename,
        pdfBase64:   invoice.base64,
        currency:    ORDER_CURRENCY,
        totalAmount: invoice.total,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'API error');
    }

    persistOrderLocally({ customer: customerDetails, entries: cartEntries, orderReference, total: invoice.total });
    showToast('Quote sent! Check your email for the invoice.', 'success');

  } catch (e) {
    console.error('Checkout error:', e);
    showToast('Something went wrong. Please try again or contact us directly.', 'error');
  } finally {
    checkoutBtn.innerHTML = origHTML;
    checkoutBtn.disabled  = false;
  }
});

// ─── System Recommender ───────────────────────────────────────────────────
let currentRecommendation = null;

function updateRecommendation() {
  const billSlider = document.getElementById('monthlyPowerBill');
  if (!billSlider) return;
  const bill = parseInt(billSlider.value, 10);
  const needBackup = document.querySelector('input[name="needBackup"]:checked').value === 'yes';
  
  const billValEl = document.getElementById('billVal');
  if (billValEl) {
    billValEl.textContent = 'KES ' + bill.toLocaleString('en-KE');
  }

  let panels = { id: 'jinko-585w', qty: 0 };
  let inverter = { id: '', qty: 1 };
  let battery = { id: '', qty: 0 };
  let sizeLabel = '';

  if (bill <= 8000) {
    panels = { id: 'jinko-585w', qty: 4 }; // 2.34 kWp
    inverter = { id: 'deye-5kw-single', qty: 1 };
    if (needBackup) battery = { id: 'dyness-5kwh', qty: 1 };
    sizeLabel = '2.3 kWp Eco System';
  } else if (bill <= 20000) {
    panels = { id: 'jinko-585w', qty: 8 }; // 4.68 kWp
    inverter = { id: 'solis-6kw', qty: 1 };
    if (needBackup) battery = { id: 'dyness-5kwh', qty: 2 };
    sizeLabel = '4.7 kWp Smart System';
  } else if (bill <= 50000) {
    panels = { id: 'jinko-620w', qty: 16 }; // 9.92 kWp
    inverter = { id: 'solis-12kw', qty: 1 };
    if (needBackup) battery = { id: 'dyness-10kwh', qty: 2 };
    sizeLabel = '9.9 kWp Executive System';
  } else if (bill <= 100000) {
    panels = { id: 'jinko-620w', qty: 32 }; // 19.8 kWp
    inverter = { id: 'solis-18kw', qty: 1 };
    if (needBackup) battery = { id: 'dyness-stack100', qty: 1 };
    sizeLabel = '19.8 kWp Commercial System';
  } else {
    panels = { id: 'jinko-620w', qty: 64 }; // 39.6 kWp
    inverter = { id: 'solis-50kw', qty: 1 };
    if (needBackup) battery = { id: 'dyness-stack100', qty: 2 };
    sizeLabel = '39.6 kWp Industrial System';
  }

  const panelProd = PRODUCTS.find(p => p.id === panels.id);
  const invProd = PRODUCTS.find(p => p.id === inverter.id);
  const batProd = battery.id ? PRODUCTS.find(p => p.id === battery.id) : null;

  let items = [];
  if (panelProd) items.push({ product: panelProd, qty: panels.qty });
  if (invProd) items.push({ product: invProd, qty: inverter.qty });
  if (batProd) items.push({ product: batProd, qty: battery.qty });

  currentRecommendation = items;

  let totalCost = items.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  const resultEl = document.getElementById('recommenderResult');
  if (!resultEl) return;
  resultEl.parentElement.classList.add('calculated');

  let itemsHtml = items.map(item => `
    <div class="recommender-rec-item">
      <div class="rec-item-left">
        <div class="rec-item-img">
          <img src="${item.product.image}" alt="${item.product.name}">
        </div>
        <span class="rec-item-qty">x${item.qty}</span>
        <span class="rec-item-name">${item.product.name}</span>
      </div>
      <span class="rec-item-price">${formatPrice(item.product.price * item.qty)}</span>
    </div>
  `).join('');

  resultEl.innerHTML = `
    <p class="recommender-rec-title">Recommended Package</p>
    <h4 class="recommender-rec-name">${sizeLabel}</h4>
    <div class="recommender-rec-items">
      ${itemsHtml}
    </div>
    <div class="recommender-rec-total">
      <span>Est. Package Total</span>
      <strong>${formatPrice(totalCost)}</strong>
    </div>
    <button id="addRecToCartBtn" class="btn btn-primary recommender-rec-btn">
      <i class="fas fa-cart-plus"></i> Add Package to Cart
    </button>
  `;

  document.getElementById('addRecToCartBtn').addEventListener('click', () => {
    currentRecommendation.forEach(item => {
      cart[item.product.id] = (cart[item.product.id] || 0) + item.qty;
    });
    updateCartUI();
    showToast('Recommended system added to cart!', 'success');
    openCart();
  });
}

function initRecommender() {
  const recCard = document.getElementById('recommenderCard');
  const header = document.getElementById('recommenderHeader');
  const body = document.getElementById('recommenderBody');
  const billSlider = document.getElementById('monthlyPowerBill');
  const radioButtons = document.getElementsByName('needBackup');

  if (!recCard || !header || !body || !billSlider) return;

  header.addEventListener('click', () => {
    const isHidden = body.classList.toggle('hidden');
    recCard.classList.toggle('active', !isHidden);
    
    const toggleSpan = document.querySelector('#toggleRecommenderBtn span');
    if (toggleSpan) {
      toggleSpan.textContent = isHidden ? 'Open Recommender' : 'Close Recommender';
    }
  });

  billSlider.addEventListener('input', updateRecommendation);
  radioButtons.forEach(radio => {
    radio.addEventListener('change', updateRecommendation);
  });

  updateRecommendation();
}

// ─── Filters ───────────────────────────────────────────────────────────────
searchInput.addEventListener('input',  renderGrid);
sortSelect.addEventListener('change',  renderGrid);

// ─── Boot: load from Supabase then render ──────────────────────────────────
(async () => {
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--clr-muted);">
        <i class="fas fa-spinner fa-spin" style="font-size:1.8rem;opacity:.5;display:block;margin-bottom:12px;"></i>
        <p>Loading products…</p>
      </div>`;
  }
  try {
    PRODUCTS = await fetchProducts();
  } catch (e) {
    console.error('Could not load products:', e);
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--clr-muted);">
          <i class="fas fa-exclamation-circle" style="font-size:1.8rem;opacity:.4;display:block;margin-bottom:12px;"></i>
          <p>Could not load products. Please refresh the page.</p>
        </div>`;
    }
    return;
  }
  renderGrid();
  updateCartUI();
  initRecommender();
})();
