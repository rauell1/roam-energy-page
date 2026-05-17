// ─── Product Catalogue ─────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 'jinko-585w',
    brand: 'Jinko',
    name: 'Jinko Bifacial Solar Panel 585W',
    category: 'Solar Panel',
    price: 32500,
    image: 'https://jinkosolarcdn.shwebspace.com/themes/basicen/skin/images/tige2.png',
    description: 'Tier 1 panel with dual-sided power generation and N-Type TOPCon cell technology for maximum efficiency. Higher energy yield from same sunlight.',
    specs: {
      'Wattage': '585 W',
      'Cell Type': 'N-Type TOPCon',
      'Technology': 'Bifacial',
      'Efficiency': '22.5%',
      'Warranty': '30-year linear performance',
    },
  },
  {
    id: 'jinko-620w',
    brand: 'Jinko',
    name: 'Jinko Bifacial Solar Panel 620W',
    category: 'Solar Panel',
    price: 38500,
    image: 'https://jinkosolarcdn.shwebspace.com/themes/basicen/skin/images/tige2.png',
    description: 'Premium Tier 1 bifacial panel with dual-sided power generation and N-Type TOPCon cell technology. Built to last a lifetime with a 30-year performance warranty.',
    specs: {
      'Wattage': '620 W',
      'Cell Type': 'N-Type TOPCon',
      'Technology': 'Bifacial',
      'Efficiency': '23.1%',
      'Warranty': '30-year linear performance',
    },
  },
  {
    id: 'deye-5kw-single',
    brand: 'Deye',
    name: 'Deye 5 kW Hybrid Inverter (Single Phase)',
    category: 'Inverter',
    price: 95000,
    image: 'Deye A.jpg',
    description: 'All-in-one hybrid inverter supporting both on-grid and off-grid modes with built-in MPPT charge controller. Parallel operation for bigger systems.',
    specs: {
      'Rated Power': '5 kW',
      'Type': 'Hybrid (Grid-Tie + Battery)',
      'Phase': 'Single Phase',
      'MPPT Channels': '2',
      'Battery Voltage': '48 V',
      'Warranty': '5 years',
    },
  },
  {
    id: 'deye-8kw-single',
    brand: 'Deye',
    name: 'Deye 8 kW Hybrid Inverter (Single Phase)',
    category: 'Inverter',
    price: 140000,
    image: 'Deye A.jpg',
    description: 'Higher-power hybrid inverter for larger homes and small businesses. Supports parallel operation and ensures uninterrupted energy flow.',
    specs: {
      'Rated Power': '8 kW',
      'Type': 'Hybrid (Grid-Tie + Battery)',
      'Phase': 'Single Phase',
      'MPPT Channels': '2',
      'Battery Voltage': '48 V',
      'Warranty': '5 years',
    },
  },
  {
    id: 'deye-10kw-three',
    brand: 'Deye',
    name: 'Deye 10 kW Hybrid Inverter (Three Phase)',
    category: 'Inverter',
    price: 185000,
    image: 'Deye A.jpg',
    description: 'Three-phase hybrid inverter for commercial applications and larger installations. Supports both on-grid and off-grid modes with built-in MPPT.',
    specs: {
      'Rated Power': '10 kW',
      'Type': 'Hybrid (Grid-Tie + Battery)',
      'Phase': 'Three Phase',
      'MPPT Channels': '2',
      'Battery Voltage': '48 V',
      'Warranty': '5 years',
    },
  },
  {
    id: 'dyness-5kw',
    brand: 'Dyness',
    name: 'Dyness LiFePO₂ Battery 5.12 kWh',
    category: 'Battery',
    price: 120000,
    image: 'Dyness A.jpg',
    description: 'LiFePO₄ chemistry with 6,000+ cycles at 90% DoD, scalable up to 50 units in parallel. Modular wall or floor mounting design.',
    specs: {
      'Capacity': '5.12 kWh',
      'Chemistry': 'LiFePO₄',
      'Voltage': '48 V / 100 Ah',
      'Cycle Life': '6,000+ cycles at 90% DoD',
      'Scalability': 'Up to 50 units in parallel',
      'Warranty': '5 years',
    },
  },
  {
    id: 'dyness-10kw',
    brand: 'Dyness',
    name: 'Dyness Power Box 10.24 kWh',
    category: 'Battery',
    price: 215000,
    image: 'Dyness.png',
    description: 'Wall-mounted all-in-one energy storage unit with built-in BMS. Ideal for homes and SMEs. Combines high capacity with sleek, compact design.',
    specs: {
      'Capacity': '10.24 kWh',
      'Chemistry': 'LiFePO₄',
      'Voltage': '48 V / 200 Ah',
      'Cycle Life': '6,000+ cycles at 90% DoD',
      'Installation': 'Wall or floor mounting',
      'Warranty': '5 years',
    },
  },
];

const ORDER_CURRENCY = 'KES';

// ─── State ─────────────────────────────────────────────────────────────────
const cart = {};
let activeBrand = 'All';

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
const checkoutBtn     = document.getElementById('checkoutBtn');
const modalOverlay    = document.getElementById('productModalOverlay');
const modalWrap       = document.getElementById('productModal');
const modalBodyEl     = document.getElementById('modalBody');
const closeModalBtn   = document.getElementById('closeModalBtn');

const checkoutConfig  = window.checkoutConfig || {};
const API_ENDPOINT    = checkoutConfig.endpoint || '/api/checkout';
const API_ACCESS_TOKEN = checkoutConfig.apiKey || (document.querySelector('meta[name="roam-api-key"]')?.content || '');

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatPrice(n) {
  return ORDER_CURRENCY + ' ' + n.toLocaleString('en-KE');
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
    const matchBrand = activeBrand === 'All' || p.brand === activeBrand;
    const matchQ     = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchBrand && matchQ;
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
        <p class="product-card-subtitle">${Object.entries(p.specs).slice(0,2).map(([k,v])=>`${k}: ${v}`).join(' · ')}</p>
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

function openCart() {
  cartDrawerEl.classList.remove('drawer-closed');
  cartDrawerEl.classList.add('drawer-open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
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

// ─── Brand chips ───────────────────────────────────────────────────────────
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    activeBrand = chip.dataset.brand;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip-active'));
    chip.classList.add('chip-active');
    renderGrid();
  });
});

// ─── Product Modal ─────────────────────────────────────────────────────────
function openModal(id) {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p) return;

  const specsHtml = Object.entries(p.specs).map(([k, v]) => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--clr-border);font-size:0.88rem;">
      <span style="color:var(--clr-muted);font-weight:500;">${k}</span>
      <span style="font-weight:600;">${v}</span>
    </div>`).join('');

  modalBodyEl.innerHTML = `
    <div class="modal-product-image">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
    </div>
    <div class="modal-product-body">
      <p class="modal-product-brand">${p.brand} · ${p.category}</p>
      <h3 class="modal-product-title">${p.name}</h3>
      <p class="modal-product-desc">${p.description}</p>
      <div style="margin-bottom:20px;">${specsHtml}</div>
      <p class="modal-product-price">${formatPrice(p.price)}</p>
      <div class="modal-actions">
        <button class="btn btn-outline-primary" id="modal-details-close">Close</button>
        <button class="btn btn-primary" data-add="${p.id}">
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

// ─── PDF generation ────────────────────────────────────────────────────────
async function generateInvoice(customerDetails, orderReference) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const LEFT_MARGIN = 20;
  const RIGHT_END   = 195;
  const safeName  = customerDetails.name  || 'Walk-in Client';
  const safeEmail = customerDetails.email || 'N/A';
  const safePhone = customerDetails.phone || 'N/A';

  const d = new Date();
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const dateStr = `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  try {
    const imgData = await loadImageAsDataUrl('Roam_Logo.png');
    doc.addImage(imgData, 'PNG', LEFT_MARGIN, 10, 35, 14);
  } catch (_) {
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(20, 110, 245);
    doc.text('ROAM', LEFT_MARGIN, 22);
  }

  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Pro Forma Invoice', RIGHT_END, 22, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(dateStr, RIGHT_END, 30, { align: 'right' });
  doc.text('Page 1 / 1', RIGHT_END, 35, { align: 'right' });

  let y = 44;
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(safeName, LEFT_MARGIN, y);
  doc.text('Roam Electric Limited', RIGHT_END, y, { align: 'right' });
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(`Phone: ${safePhone}`, LEFT_MARGIN, y + 5);
  doc.text(`Email: ${safeEmail}`, LEFT_MARGIN, y + 9);
  ['National Park East Gate Rd.', 'P.O. Box nr 18284', 'Nairobi, 00500', 'Kenya'].forEach((line, i) => {
    doc.text(line, RIGHT_END, y + 5 + i * 4.5, { align: 'right' });
  });

  y = 75;
  const leftMeta = [
    ['Document No',    orderReference],
    ['Customer Name',  safeName],
    ['Customer Phone', safePhone],
    ['Customer Email', safeEmail],
    ['Document Date',  dateStr],
    ['Currency',       ORDER_CURRENCY],
    ['Salesperson',    'Roy Otieno'],
  ];
  const rightMeta = [
    ['Email',                 'info@roam-electric.com'],
    ['Home Page',             'www.roam-electric.com'],
    ['Phone No.',             '+254740666555'],
    ['VAT Registration No.', 'P05170428D'],
    ['Mpesa Till No.',        '9572270'],
    ['Bank',                  'Standard Chartered'],
    ['Account No.',           '0102487879100 (KES)'],
  ];

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  leftMeta.forEach(([label, val], i) => {
    doc.text(label,        LEFT_MARGIN,      y + i * 5);
    doc.text(String(val),  LEFT_MARGIN + 45, y + i * 5);
  });
  rightMeta.forEach(([label, val], i) => {
    doc.text(label, 105,       y + i * 5);
    doc.text(val,   RIGHT_END, y + i * 5, { align: 'right' });
  });

  const COL = { Item: 60, Qty: 15, Price: 25, HS: 15, VATpct: 12, VATAmt: 23, Amt: 25 };
  const colX = {
    Item:    LEFT_MARGIN,
    Qty:     LEFT_MARGIN + COL.Item,
    Price:   LEFT_MARGIN + COL.Item + COL.Qty,
    HS:      LEFT_MARGIN + COL.Item + COL.Qty + COL.Price,
    VATpct:  LEFT_MARGIN + COL.Item + COL.Qty + COL.Price + COL.HS,
    VATAmt:  LEFT_MARGIN + COL.Item + COL.Qty + COL.Price + COL.HS + COL.VATpct,
    Amt:     RIGHT_END,
  };

  y = 135;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.text('Item',        colX.Item,                     y);
  doc.text('Quantity',    colX.Qty    + COL.Qty   / 2,   y, { align: 'center' });
  doc.text('Unit Price',  colX.Price  + COL.Price,        y, { align: 'right' });
  doc.text('HS Code',     colX.HS     + COL.HS    / 2,   y, { align: 'center' });
  doc.text('VAT%',        colX.VATpct + COL.VATpct / 2,  y, { align: 'center' });
  doc.text('VAT Amount',  colX.VATAmt + COL.VATAmt,       y, { align: 'right' });
  doc.text('Amount',      colX.Amt,                       y, { align: 'right' });
  doc.setDrawColor(0);
  doc.line(LEFT_MARGIN, y + 1, RIGHT_END, y + 1);
  y += 8;

  let grandTotal = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    const p = PRODUCTS.find(product => product.id === id);
    if (!p) return;
    const lineTotal = p.price * qty;
    grandTotal += lineTotal;
    const startY = y;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(String(qty),             colX.Qty    + COL.Qty    / 2,  startY, { align: 'center' });
    doc.text(formatAmt(p.price),      colX.Price  + COL.Price,        startY, { align: 'right' });
    doc.text('0',                     colX.VATpct + COL.VATpct / 2,  startY, { align: 'center' });
    doc.text('0.00',                  colX.VATAmt + COL.VATAmt,       startY, { align: 'right' });
    doc.text(formatAmt(lineTotal),    colX.Amt,                       startY, { align: 'right' });
    doc.setFont(undefined, 'bold');
    const nameLines = doc.splitTextToSize(p.name, COL.Item - 2);
    doc.text(nameLines, LEFT_MARGIN, startY);
    y = startY + nameLines.length * 5 + 2;
  });

  y += 5;
  const L_COL_X = RIGHT_END - 60;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Total Amount',   L_COL_X, y);
  doc.setFont(undefined, 'normal');
  doc.text(formatAmt(grandTotal), RIGHT_END, y, { align: 'right' });
  y += 6;
  doc.setFont(undefined, 'bold');
  doc.text('VAT Amount', L_COL_X, y);
  doc.setFont(undefined, 'normal');
  doc.text('0.00', RIGHT_END, y, { align: 'right' });
  doc.line(L_COL_X, y + 1, RIGHT_END, y + 1);
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Total Incl. VAT', L_COL_X, y);
  doc.setFont(undefined, 'normal');
  doc.text(formatAmt(grandTotal), RIGHT_END, y, { align: 'right' });

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

// ─── Filters ───────────────────────────────────────────────────────────────
searchInput.addEventListener('input',  renderGrid);
sortSelect.addEventListener('change',  renderGrid);

// ─── Boot ──────────────────────────────────────────────────────────────────
renderGrid();
updateCartUI();
