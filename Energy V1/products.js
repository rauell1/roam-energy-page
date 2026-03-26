// ─── Product Catalogue ─────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 'jinko-585w',
    brand: 'Jinko',
    name: 'Jinko Bifacial Solar Panel 585W',
    category: 'Solar Panel',
    price: 32500,
    image: 'https://jinkosolarcdn.shwebspace.com/themes/basicen/skin/images/tige2.png',
    description: 'Tier 1 panel with dual-sided power generation and advanced N-Type TOPCon cell technology for maximum efficiency. Higher energy yield from same sunlight.',
    specs: {
      'Wattage': '585 W',
      'Cell Type': 'N-Type TOPCon',
      'Technology': 'Bifacial',
      'Efficiency': '22.5 %',
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
    description: 'Premium Tier 1 bifacial panel with dual-sided power generation and advanced N-Type TOPCon cell technology. Built to last a lifetime with 30-year warranty.',
    specs: {
      'Wattage': '620 W',
      'Cell Type': 'N-Type TOPCon',
      'Technology': 'Bifacial',
      'Efficiency': '23.1 %',
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
    description: 'All-in-one hybrid inverter supporting both on-grid and off-grid modes with built-in MPPT charge controller. Parallel operation for bigger systems. Ensures uninterrupted energy flow.',
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
    description: 'Higher-power hybrid inverter suitable for larger homes and small businesses. Supports parallel operation and ensures uninterrupted energy flow. Ideal for homes and businesses.',
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
    description: 'Three-phase hybrid inverter for commercial applications and larger installations. All-in-one hybrid inverter supporting both on-grid and off-grid modes with built-in MPPT charge controller.',
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
    name: 'Dyness LiFePO4 Battery 5.12 kWh',
    category: 'Battery',
    price: 120000,
    image: 'Dyness A.jpg',
    description: 'The LiFePO4 Dyness Battery brings reliable power with over 6,000 cycles at 90% DoD, scalable up to 50 units in parallel. Modular design with wall or floor mounting options.',
    specs: {
      'Capacity': '5.12 kWh',
      'Chemistry': 'LiFePO₄',
      'Voltage': '48 V / 100 Ah',
      'Cycle Life': '6 000+ cycles at 90% DoD',
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
    description: 'Wall-mounted all-in-one energy storage unit with built-in BMS. Ideal for homes and SMEs. Combines power with sleek design and flexible installation.',
    specs: {
      'Capacity': '10.24 kWh',
      'Chemistry': 'LiFePO₄',
      'Voltage': '48 V / 200 Ah',
      'Cycle Life': '6 000+ cycles at 90% DoD',
      'Installation': 'Wall or floor mounting',
      'Warranty': '5 years',
    },
  },
];

const ORDER_CURRENCY = 'KES';
const WHATSAPP_NUMBER = (window.ROAM_WHATSAPP_NUMBER || '+254704612435').replace(/\D/g, '');
const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

function buildWhatsAppLink(message) {
  const params = new URLSearchParams({ app_absent: '0' });
  if (message) params.set('text', message);
  return `${WHATSAPP_BASE_URL}?${params.toString()}`;
}

window.ROAM_WHATSAPP_NUMBER = WHATSAPP_NUMBER;

// ─── State ─────────────────────────────────────────────────────────────────
const cart = {};

// ─── DOM refs ──────────────────────────────────────────────────────────────
const grid          = document.getElementById('productsGrid');
const searchInput   = document.getElementById('searchInput');
const brandFilter   = document.getElementById('brandFilter');
const sortSelect    = document.getElementById('sortSelect');
const openCartBtn   = document.getElementById('openCartBtn');
const closeCartBtn  = document.getElementById('closeCartBtn');
const cartOverlay   = document.getElementById('cartDrawerOverlay');
const cartDrawer    = document.getElementById('cartDrawer');
const cartItemsEl   = document.getElementById('cartItems');
const cartTotalEl   = document.getElementById('cartTotal');
const floatingCount = document.getElementById('floatingCount');
const checkoutBtn   = document.getElementById('checkoutBtn');
const modalOverlay  = document.getElementById('productModalOverlay');
const productModal  = document.getElementById('productModal');
const modalTitle    = document.getElementById('modalTitle');
const modalBody     = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModalBtn');

const checkoutConfig = window.checkoutConfig || {};
const API_ENDPOINT = checkoutConfig.endpoint || '/api/checkout';
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

// ─── Grid rendering ────────────────────────────────────────────────────────
function filteredProducts() {
  const q     = searchInput.value.toLowerCase();
  const brand = brandFilter.value;
  const sort  = sortSelect.value;

  let list = PRODUCTS.filter(p => {
    const matchBrand = brand === 'All' || p.brand === brand;
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

  if (!products.length) {
    grid.innerHTML = '<p class="col-span-3 text-center text-gray-400 py-16">No products match your search.</p>';
    return;
  }

  products.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col animate-popIn';
    card.style.animationDelay = `${i * 60}ms`;

    const imgTag = p.image
      ? `<img src="${p.image}" alt="${p.name}" class="w-full h-48 object-cover rounded-t-2xl cursor-pointer hover:opacity-90 transition-opacity" data-open="${p.id}">`
      : `<div class="w-full h-48 bg-orange-50 flex items-center justify-center rounded-t-2xl cursor-pointer" data-open="${p.id}"><i class="fa-solid fa-solar-panel text-6xl text-orange-300"></i></div>`;

    card.innerHTML = `
      ${imgTag}
      <div class="p-5 flex flex-col flex-1">
        <span class="text-xs font-semibold uppercase tracking-wide text-orange-500 mb-1">${p.brand} · ${p.category}</span>
        <h3 class="font-bold text-lg mb-2 cursor-pointer hover:text-orange-600 transition-colors" data-open="${p.id}">${p.name}</h3>
        <p class="text-gray-500 text-sm flex-1 mb-4">${p.description}</p>
        <div class="flex items-center justify-between mt-auto">
          <span class="text-xl font-bold text-gray-900">${formatPrice(p.price)}</span>
          <button data-add="${p.id}" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <i class="fa-solid fa-cart-plus mr-1"></i>Add to Cart
          </button>
        </div>
      </div>`;

    grid.appendChild(card);
  });

  grid.querySelectorAll('[data-open]').forEach(el => {
    el.addEventListener('click', () => openModal(el.dataset.open));
  });
  grid.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.add));
  });
}

// ─── Cart ──────────────────────────────────────────────────────────────────
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  updateCartUI();
  openCart();
  openCartBtn.classList.remove('pulse');
  void openCartBtn.offsetWidth;
  openCartBtn.classList.add('pulse');
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
  floatingCount.textContent = cartCount();
  cartTotalEl.textContent   = formatPrice(cartTotal());

  if (!cartCount()) {
    cartItemsEl.innerHTML = '<p class="text-gray-400 text-center py-8">Your cart is empty.</p>';
    return;
  }

  cartItemsEl.innerHTML = '';
  Object.entries(cart).forEach(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    if (!p) return;
    const row = document.createElement('div');
    row.className = 'flex items-center gap-3 border-b pb-3';
    row.innerHTML = `
      <div class="flex-1">
        <p class="font-medium text-sm">${p.name}</p>
        <p class="text-xs text-gray-500">${formatPrice(p.price)} each</p>
      </div>
      <input type="number" min="1" value="${qty}" class="w-14 border rounded-lg text-center text-sm p-1" data-qty="${id}">
      <button data-remove="${id}" class="text-red-400 hover:text-red-600 transition-colors">
        <i class="fa-solid fa-trash text-sm"></i>
      </button>`;
    cartItemsEl.appendChild(row);
  });

  cartItemsEl.querySelectorAll('[data-qty]').forEach(input => {
    input.addEventListener('change', () => setQuantity(input.dataset.qty, input.value));
  });
  cartItemsEl.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.remove));
  });
}

function openCart() {
  cartDrawer.classList.remove('drawer-closed');
  cartDrawer.classList.add('drawer-open');
  cartOverlay.classList.remove('hidden');
}

function closeCart() {
  cartDrawer.classList.remove('drawer-open');
  cartDrawer.classList.add('drawer-closed');
  cartOverlay.classList.add('hidden');
}

openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// ─── Product Modal ─────────────────────────────────────────────────────────
function openModal(id) {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p) return;

  modalTitle.textContent = p.name;

  const specsRows = Object.entries(p.specs)
    .map(([k, v]) => `<tr><td class="py-1 pr-4 text-sm font-medium text-gray-600 whitespace-nowrap">${k}</td><td class="py-1 text-sm text-gray-800">${v}</td></tr>`)
    .join('');

  const imgHtml = p.image
    ? `<img src="${p.image}" alt="${p.name}" class="w-full h-48 object-cover rounded-xl mb-4">`
    : `<div class="w-full h-32 bg-orange-50 flex items-center justify-center rounded-xl mb-4"><i class="fa-solid fa-solar-panel text-5xl text-orange-300"></i></div>`;

  modalBody.innerHTML = `
    ${imgHtml}
    <p class="text-gray-600 mb-4">${p.description}</p>
    <table class="w-full mb-4">${specsRows}</table>
    <div class="flex items-center justify-between pt-4 border-t">
      <span class="text-2xl font-bold">${formatPrice(p.price)}</span>
      <button data-add="${p.id}" class="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium transition-colors">
        <i class="fa-solid fa-cart-plus mr-1"></i>Add to Cart
      </button>
    </div>`;

  modalBody.querySelector('[data-add]').addEventListener('click', () => {
    addToCart(id);
    closeModal();
  });

  productModal.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  productModal.classList.add('hidden');
  modalOverlay.classList.add('hidden');
}

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// ─── PDF generation ────────────────────────────────────────────────────────
async function generateInvoice(customerDetails, orderReference) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Layout constants (mm, A4 = 210 × 297)
  const LEFT_MARGIN = 20;
  const RIGHT_END   = 195;
  const safeName  = customerDetails.name  || 'Walk-in Client';
  const safeEmail = customerDetails.email || 'N/A';
  const safePhone = customerDetails.phone || 'N/A';

  // Date string matching Python strftime("%d %b %Y").upper()
  const d = new Date();
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const dateStr = `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  // ── 1. HEADER ──────────────────────────────────────────────────────────────
  // Logo (falls back to "ROAM" text if image cannot be loaded)
  try {
    const imgData = await loadImageAsDataUrl('Roam_Logo.png');
    doc.addImage(imgData, 'PNG', LEFT_MARGIN, 10, 35, 14);
  } catch (_) {
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(244, 121, 32);
    doc.text('ROAM', LEFT_MARGIN, 22);
  }

  // "Pro Forma Invoice" title — right-aligned
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Pro Forma Invoice', RIGHT_END, 22, { align: 'right' });

  // Date and page number — right-aligned
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(dateStr, RIGHT_END, 30, { align: 'right' });
  doc.text('Page 1 / 1', RIGHT_END, 35, { align: 'right' });

  // ── 2. ENTITY NAMES & ADDRESS ──────────────────────────────────────────────
  let y = 44;
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(safeName, LEFT_MARGIN, y);

  // Roam Electric address — right-aligned
  doc.text('Roam Electric Limited', RIGHT_END, y, { align: 'right' });
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(`Phone: ${safePhone}`, LEFT_MARGIN, y + 5);
  doc.text(`Email: ${safeEmail}`, LEFT_MARGIN, y + 9);
  ['National Park East Gate Rd.', 'P.O. Box nr 18284', 'Nairobi, 00500', 'Kenya'].forEach((line, i) => {
    doc.text(line, RIGHT_END, y + 5 + i * 4.5, { align: 'right' });
  });

  // ── 3. METADATA SECTIONS ───────────────────────────────────────────────────
  y = 75;
  const leftMeta = [
    ['Document No',        orderReference],
    ['Customer Name',      safeName],
    ['Customer Phone',     safePhone],
    ['Customer Email',     safeEmail],
    ['Document Date',      dateStr],
    ['Currency',           ORDER_CURRENCY],
    ['Salesperson',        'Roy Otieno'],
  ];
  const rightMeta = [
    ['Email',              'info@roam-electric.com'],
    ['Home Page',          'www.roam-electric.com'],
    ['Phone No.',          '+254740666555'],
    ['VAT Registration No.', 'P05170428D'],
    ['Mpesa Till No.',     '9572270'],
    ['Bank',               'Standard Chartered'],
    ['Account No.',        '0102487879100 (KES)'],
  ];

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  leftMeta.forEach(([label, val], i) => {
    doc.text(label,       LEFT_MARGIN,      y + i * 5);
    doc.text(String(val), LEFT_MARGIN + 45, y + i * 5);
  });
  rightMeta.forEach(([label, val], i) => {
    doc.text(label, 105,       y + i * 5);
    doc.text(val,   RIGHT_END, y + i * 5, { align: 'right' });
  });

  // ── 4. ITEM TABLE ──────────────────────────────────────────────────────────
  // Column widths (mm) — total = 60+15+25+15+12+23+25 = 175 (LEFT_MARGIN to RIGHT_END)
  const COL = { Item: 60, Qty: 15, Price: 25, HS: 15, VATpct: 12, VATAmt: 23, Amt: 25 };
  // Precompute right-edge x for each column
  const colX = {
    Item:   LEFT_MARGIN,
    Qty:    LEFT_MARGIN + COL.Item,
    Price:  LEFT_MARGIN + COL.Item + COL.Qty,
    HS:     LEFT_MARGIN + COL.Item + COL.Qty + COL.Price,
    VATpct: LEFT_MARGIN + COL.Item + COL.Qty + COL.Price + COL.HS,
    VATAmt: LEFT_MARGIN + COL.Item + COL.Qty + COL.Price + COL.HS + COL.VATpct,
    Amt:    RIGHT_END,
  };

  y = 135;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.text('Item',       colX.Item,                     y);
  doc.text('Quantity',   colX.Qty   + COL.Qty   / 2,    y, { align: 'center' });
  doc.text('Unit Price', colX.Price + COL.Price,         y, { align: 'right' });
  doc.text('HS Code',    colX.HS    + COL.HS    / 2,    y, { align: 'center' });
  doc.text('VAT%',       colX.VATpct + COL.VATpct / 2,  y, { align: 'center' });
  doc.text('VAT Amount', colX.VATAmt + COL.VATAmt,       y, { align: 'right' });
  doc.text('Amount',     colX.Amt,                       y, { align: 'right' });
  doc.setDrawColor(0);
  doc.line(LEFT_MARGIN, y + 1, RIGHT_END, y + 1);
  y += 8;

  // ── 5. ITEM ROWS ───────────────────────────────────────────────────────────
  let grandTotal = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    const p = PRODUCTS.find((product) => product.id === id);
    if (!p) return;
    const lineTotal = p.price * qty;
    grandTotal += lineTotal;
    const startY = y;

    // Numerical cells (right of the Item column)
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(String(qty),             colX.Qty    + COL.Qty    / 2,   startY, { align: 'center' });
    doc.text(formatAmt(p.price),      colX.Price  + COL.Price,         startY, { align: 'right' });
    doc.text('0',                     colX.VATpct + COL.VATpct / 2,   startY, { align: 'center' });
    doc.text('0.00',                  colX.VATAmt + COL.VATAmt,        startY, { align: 'right' });
    doc.text(formatAmt(lineTotal),    colX.Amt,                        startY, { align: 'right' });

    // Item name (bold, wraps inside Item column)
    doc.setFont(undefined, 'bold');
    const nameLines = doc.splitTextToSize(p.name, COL.Item - 2);
    doc.text(nameLines, LEFT_MARGIN, startY);
    const itemY = startY + nameLines.length * 5;

    y = itemY + 2;
  });

  // ── 6. TOTALS ──────────────────────────────────────────────────────────────
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
  doc.text('VAT Amount',     L_COL_X, y);
  doc.setFont(undefined, 'normal');
  doc.text('0.00',           RIGHT_END, y, { align: 'right' });
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
  const url = URL.createObjectURL(blob);
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
  if (typeof localStorage === 'undefined') return;
  try {
    const payload = {
      customer,
      entries,
      orderReference,
      currency: ORDER_CURRENCY,
      total,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('roamLastOrder', JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to cache order locally', err);
  }
}

async function fallbackToWhatsApp(blob, filename, entries, ref, total, customer) {
  const lines = entries.map(e => `• ${e.name || e.id} × ${e.qty}`).join('\n');
  const summary = `Hi Roam Energy,\n\nOrder Ref: ${ref}\nCustomer: ${customer.name}\nPhone: ${customer.phone}\nEmail: ${customer.email}\n\n${lines}\n\nTotal: ${ORDER_CURRENCY} ${total.toLocaleString('en-KE')}`;
  const waUrl = buildWhatsAppLink(summary);

  const canShareFile = typeof navigator !== 'undefined' && typeof File !== 'undefined' && typeof navigator.canShare === 'function';
  if (canShareFile) {
    try {
      const pdfFile = new File([blob], filename, { type: 'application/pdf' });
      const shareData = { title: `Roam Energy Order ${ref}`, text: summary, files: [pdfFile] };
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
      }
    } catch (err) {
      console.warn('Share API failed, falling back to WhatsApp link', err);
    }
  }

  window.location.assign(waUrl);
}

// ─── Checkout state ────────────────────────────────────────────────────────
let customerDetails, cartEntries, orderReference, invoice;

async function handleCheckout() {
  if (!API_ACCESS_TOKEN) {
    console.warn('Checkout API key is not set. The request may be rejected.');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (API_ACCESS_TOKEN) {
    headers['x-api-key'] = API_ACCESS_TOKEN;
  }

  const pdfBase64 = invoice.base64 || await blobToDataUrl(invoice.blob);
  invoice.base64 = pdfBase64;

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user: customerDetails,
      cart: cartEntries,
      orderReference,
      filename: invoice.filename,
      pdfBase64,
      currency: ORDER_CURRENCY,
      totalAmount: invoice.total,
    }),
  });

  let result = {};
  try {
    result = await response.json();
  } catch (_) {
    result = {};
  }

  if (!response.ok) {
    const error = new Error(result.message || 'Checkout failed');
    error.detail = result.detail;
    throw error;
  }

  return result;
}

checkoutBtn.addEventListener('click', async () => {
  const name  = document.getElementById('customerName').value.trim();
  const email = document.getElementById('customerEmail').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();

  if (!cartCount()) { alert('Your cart is empty.'); return; }
  if (!name || !email || !phone) { alert('Please fill in your name, email, and phone number.'); return; }

  customerDetails = { name, email, phone };
  cartEntries     = Object.entries(cart).map(([id, qty]) => ({ id, qty, name: PRODUCTS.find(p => p.id === id)?.name }));
  orderReference  = generateOrderReference();
  invoice         = await generateInvoice(customerDetails, orderReference);
  invoice.base64  = await blobToDataUrl(invoice.blob);
  downloadInvoice(invoice.blob, invoice.filename);

  const origLabel = checkoutBtn.textContent;
  checkoutBtn.textContent = 'Sending…';
  checkoutBtn.disabled    = true;

  try {
    await handleCheckout();
    alert('Quote sent via email and WhatsApp. A PDF copy has been downloaded locally.');
  } catch (e) {
    persistOrderLocally({
      customer: customerDetails,
      entries: cartEntries,
      orderReference,
      total: invoice.total,
    });
    await fallbackToWhatsApp(invoice.blob, invoice.filename, cartEntries, orderReference, invoice.total, customerDetails);
    console.error('Checkout failed, opened WhatsApp fallback.', e);
    alert('We could not send automatically. We saved your details locally and opened WhatsApp with your order details (PDF downloaded).');
  } finally {
    checkoutBtn.textContent = origLabel;
    checkoutBtn.disabled    = false;
  }
});

// ─── Filters ───────────────────────────────────────────────────────────────
searchInput.addEventListener('input',  renderGrid);
brandFilter.addEventListener('change', renderGrid);
sortSelect.addEventListener('change',  renderGrid);

// ─── Boot ──────────────────────────────────────────────────────────────────
renderGrid();
updateCartUI();
