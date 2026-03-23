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
  let y = 50;

  doc.setFontSize(22);
  doc.setTextColor(249, 115, 22);
  doc.text('Roam Energy', 40, y);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text('roamenergy.co.ke', 40, y + 18);

  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(`Order: ${orderReference}`, pageW - 40, y, { align: 'right' });
  doc.text(new Date().toLocaleDateString('en-KE', { dateStyle: 'long' }), pageW - 40, y + 16, { align: 'right' });

  y += 50;

  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text('Bill To:', 40, y);
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text(customerDetails.name,  40, y + 16);
  doc.text(customerDetails.email, 40, y + 32);
  doc.text(customerDetails.phone, 40, y + 48);

  y += 80;

  doc.setFillColor(249, 115, 22);
  doc.rect(40, y, pageW - 80, 22, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255);
  doc.text('Product',    48,          y + 15);
  doc.text('Qty',        pageW - 200, y + 15, { align: 'right' });
  doc.text('Unit Price', pageW - 130, y + 15, { align: 'right' });
  doc.text('Total',      pageW - 45,  y + 15, { align: 'right' });

  y += 30;

  let total = 0;
  Object.entries(cart).forEach(([id, qty], i) => {
    const p = PRODUCTS.find(p => p.id === id);
    if (!p) return;
    const lineTotal = p.price * qty;
    total += lineTotal;
    if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(40, y - 5, pageW - 80, 20, 'F'); }
    doc.setFontSize(10);
    doc.setTextColor(30);
    doc.text(p.name,                  48,          y + 9);
    doc.text(String(qty),             pageW - 200, y + 9, { align: 'right' });
    doc.text(formatPrice(p.price),    pageW - 130, y + 9, { align: 'right' });
    doc.text(formatPrice(lineTotal),  pageW - 45,  y + 9, { align: 'right' });
    y += 22;
  });

  y += 10;
  doc.setDrawColor(200);
  doc.line(40, y, pageW - 40, y);
  y += 16;
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text('Total',             pageW - 200, y, { align: 'right' });
  doc.text(formatPrice(total),  pageW - 45,  y, { align: 'right' });
  doc.setFont(undefined, 'normal');

  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('Thank you for your order. Roam Energy – Powering the Future.', pageW / 2, footerY, { align: 'center' });

  const filename = `Roam-Energy-Order-${orderReference}.pdf`;
  const blob = doc.output('blob');
  return { blob, filename, total };
}

// ─── Utilities ─────────────────────────────────────────────────────────────
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
  window.open(`https://wa.me/254700000000?text=${msg}`, '_blank');
}

// ─── Checkout state ────────────────────────────────────────────────────────
let customerDetails, cartEntries, orderReference, invoice;

async function handleCheckout() {
    const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user: customerDetails,
            cart: cartEntries,
            orderReference,
            filename: invoice.filename,
            pdfBase64: await blobToDataUrl(invoice.blob),
            currency: ORDER_CURRENCY,
            totalAmount: invoice.total
        })
    });

    if (!response.ok) {
        const result = await response.json();
        if (result.waLink) {
            window.open(result.waLink);
        } else {
            fallbackToWhatsApp(invoice.blob, invoice.filename, cartEntries, orderReference, invoice.total, customerDetails);
        }
    }
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

  const origLabel = checkoutBtn.textContent;
  checkoutBtn.textContent = 'Sending…';
  checkoutBtn.disabled    = true;

  try {
    await handleCheckout();
  } catch (e) {
    fallbackToWhatsApp(invoice.blob, invoice.filename, cartEntries, orderReference, invoice.total, customerDetails);
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