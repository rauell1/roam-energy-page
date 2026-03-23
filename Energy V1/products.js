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
  const doc  = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  const accent = [249, 115, 22];
  const textDark = [41, 37, 36];
  const textMuted = [90, 98, 104];

  // Header band
  doc.setFillColor(...accent);
  doc.rect(0, 0, pageW, 86, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text('Roam Energy — Solar & Storage Solutions', margin, 36);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Premium solar, hybrid inverters, and storage built for Africa.', margin, 56);
  doc.setFontSize(13);
  doc.text(`Quote ${orderReference}`, pageW - margin, 32, { align: 'right' });
  doc.text(new Date().toLocaleDateString('en-KE', { dateStyle: 'long' }), pageW - margin, 50, { align: 'right' });

  let y = 110;

  // Customer + company blocks
  doc.setTextColor(...textDark);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Prepared For', margin, y);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...textMuted);
  doc.setFontSize(11);
  const customerLines = [
    customerDetails.name,
    customerDetails.email,
    customerDetails.phone,
  ]
    .filter(Boolean)
    .flatMap((line) => doc.splitTextToSize(line, (pageW / 2) - margin * 1.5));
  let infoY = y + 18;
  customerLines.forEach((line) => {
    doc.text(line, margin, infoY);
    infoY += 16;
  });

  doc.setTextColor(...textDark);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  const rightX = pageW / 2 + 10;
  doc.text('Prepared By', rightX, y);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...textMuted);
  doc.setFontSize(11);
  ['Roam Energy', 'hello@roamenergy.co.ke', '+254 704 612 435', 'www.roamenergy.co.ke'].forEach((line, idx) => {
    doc.text(line, rightX, y + 18 + idx * 16);
  });

  y = Math.max(infoY, y + 18 + 4 * 16) + 16;
  doc.setDrawColor(230);
  doc.line(margin, y, pageW - margin, y);
  y += 20;

  // Summary text
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...textDark);
  doc.setFontSize(13);
  doc.text('Solution Summary', margin, y);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...textMuted);
  doc.setFontSize(11);
  const summary = doc.splitTextToSize(
    'Tailored solar solution with tier-one modules, hybrid inverters, and scalable lithium storage. Pricing shown is for equipment; installation is confirmed after site validation.',
    pageW - margin * 2
  );
  doc.text(summary, margin, y + 16);
  y += 16 + summary.length * 14 + 6;

  // Table headers
  const tableX = margin;
  const tableW = pageW - margin * 2;
  doc.setFillColor(246, 247, 249);
  doc.rect(tableX, y, tableW, 30, 'F');
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...textDark);
  doc.setFontSize(11);
  doc.text('Item', tableX + 12, y + 20);
  doc.text('Qty', tableX + tableW * 0.55, y + 20, { align: 'right' });
  doc.text('Unit', tableX + tableW * 0.72, y + 20, { align: 'right' });
  doc.text('Line Total', tableX + tableW - 12, y + 20, { align: 'right' });

  y += 38;

  let total = 0;
  Object.entries(cart).forEach(([id, qty], index) => {
    const p = PRODUCTS.find((product) => product.id === id);
    if (!p) return;
    const lineTotal = p.price * qty;
    total += lineTotal;

    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(tableX, y - 16, tableW, 34, 'F');
    }

    doc.setFont(undefined, 'bold');
    doc.setTextColor(...textDark);
    doc.setFontSize(11);
    const nameLines = doc.splitTextToSize(p.name, tableW * 0.5);
    doc.text(nameLines, tableX + 12, y);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(...textMuted);
    doc.text(String(qty), tableX + tableW * 0.55, y, { align: 'right' });
    doc.text(formatPrice(p.price), tableX + tableW * 0.72, y, { align: 'right' });
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...textDark);
    doc.text(formatPrice(lineTotal), tableX + tableW - 12, y, { align: 'right' });

    y += Math.max(26, nameLines.length * 14 + 10);
  });

  // Totals box
  const totalsTop = y + 6;
  doc.setDrawColor(235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(tableX + tableW * 0.55, totalsTop, tableW * 0.45, 70, 6, 6, 'S');
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...textMuted);
  doc.setFontSize(11);
  doc.text('Subtotal', tableX + tableW * 0.55 + 14, totalsTop + 22);
  doc.text('Due',      tableX + tableW * 0.55 + 14, totalsTop + 46);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...textDark);
  doc.text(formatPrice(total), tableX + tableW - 16, totalsTop + 22, { align: 'right' });
  doc.text(formatPrice(total), tableX + tableW - 16, totalsTop + 46, { align: 'right' });

  y = totalsTop + 90;

  // Notes
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...textDark);
  doc.setFontSize(12);
  doc.text('Notes', margin, y);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...textMuted);
  const notes = doc.splitTextToSize(
    'This quotation is valid for 14 days from the date above. Equipment availability may vary; we will confirm installation timelines after a site visit. Need adjustments? Reply to this email or WhatsApp and we will refine the scope.',
    pageW - margin * 2
  );
  doc.text(notes, margin, y + 16);

  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('Roam Energy — Smarter solar and storage for homes and businesses.', pageW / 2, footerY, { align: 'center' });

  const filename = `Roam-Energy-Quote-${orderReference}.pdf`;
  const blob = doc.output('blob');
  return { blob, filename, total };
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

function generateOrderReference() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RE-${ts}-${rand}`;
}

function fallbackToWhatsApp(blob, filename, entries, ref, total, customer) {
  const lines = entries.map(e => `• ${e.name || e.id} × ${e.qty}`).join('\n');
  const msg = encodeURIComponent(
    `Hi Roam Energy,\n\nOrder Ref: ${ref}\nCustomer: ${customer.name}\nPhone: ${customer.phone}\n\n${lines}\n\nTotal: ${ORDER_CURRENCY} ${total.toLocaleString('en-KE')}`
  );
  window.open(`https://wa.me/254704612435?text=${msg}`, '_blank');
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
    if (result.waLink) {
      window.open(result.waLink, '_blank');
    }
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
    fallbackToWhatsApp(invoice.blob, invoice.filename, cartEntries, orderReference, invoice.total, customerDetails);
    console.error('Checkout failed, opened WhatsApp fallback.', e);
    alert('We could not send automatically. We opened WhatsApp with your order details and downloaded the PDF locally.');
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
