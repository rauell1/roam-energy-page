const PRODUCTS = [
  {id:"JINKO-585W Bifacial", brand:"Jinko", category:"Solar Panels", title:"Jinko Bifacial Panel 585W", price:8190,
   img:"https://jinkosolarcdn.shwebspace.com/themes/basicen/skin/images/tige2.png",
   specs:{Wattage:"585W", Efficiency:"22.5%", Warranty:"30-year linear performance", Notes:"Glass-glass design; TOPCon cells; bifacial gain depends on albedo."},
   description:"High efficiency bifacial module optimized for commercial rooftop and ground-mounted installations."
  },
  {id:"JINKO-620W Bifacial", brand:"Jinko", category:"Solar Panels", title:"Jinko Bifacial Panel 620W", price:8680,
   img:"https://jinkosolarcdn.shwebspace.com/themes/basicen/skin/images/tige2.png",
   specs:{Wattage:"620W", Efficiency:"23.1%", Warranty:"30-year linear performance", Notes:"Higher power output per module for reduced BOS costs."},
   description:"Top-tier N-Type TOPCon cells in a bifacial module — ideal where area is constrained and you want maximum kWp per m²."
  },
  {id:"DEYE-6K", brand:"Deye", category:"Inverters", title:"DEYE 6kW, 48V Hybrid Inverter Single Phase", price:129000,
   img:"https://www.deyeinverter.com/deyeinverter/2025/01/16/sun-3.6-8k-sg05lp1-eu2.png",
   specs:{Capacity:"6kW", Warranty:"5 Years", Features:"Built-in MPPT, battery-ready, app monitoring"},
   description:"Reliable hybrid inverter suitable for residential installs. Supports battery charging and grid feed-in."
  },
  {id:"DEYE-10K", brand:"Deye", category:"Inverters", title:"DEYE 10kW, 48V Hybrid Inverter Three Phase", price:280000,
   img:"https://www.deyeinverter.com/deyeinverter/2025/01/16/sun-3.6-8k-sg05lp1-eu2.png",
   specs:{Capacity:"10kW", Warranty:"5 Years", Features:"Three-phase, strong continuous output"},
   description:"Commercial-grade hybrid inverter with robust runtime and monitoring features."
  },
  {id:"DEYE-14K", brand:"Deye", category:"Inverters", title:"DEYE 14kW, 48V Hybrid Inverter Three Phase", price:295000,
   img:"https://www.deyeinverter.com/deyeinverter/2025/01/16/sun-3.6-8k-sg05lp1-eu2.png",
   specs:{Capacity:"14kW", Warranty:"5 Years", Features:"Three-phase, strong continuous output"},
   description:"Commercial-grade hybrid inverter with robust runtime and monitoring features."
  },
  {id:"DEYE-20K", brand:"Deye", category:"Inverters", title:"DEYE 20kW, 48V Hybrid Inverter Three Phase", price:425000,
   img:"https://www.deyeinverter.com/deyeinverter/2025/01/16/sun-3.6-8k-sg05lp1-eu2.png",
   specs:{Capacity:"20kW", Warranty:"5 Years", Features:"Three-phase, strong continuous output"},
   description:"Commercial-grade hybrid inverter with robust runtime and monitoring features."
  },
  {id:"DYN-5.0C", brand:"Dyness", category:"Batteries", title:"Dyness STACK 5.1 LIBA LV 1.0C", price:115000,
   img:"Dyness A.jpg",
   specs:{Model:"DL5.0C", Capacity:"5.12kWh", Cycles:"6000+ @ 90% DoD", Chemistry:"LiFePO4", Weight: "49.9 kg", Warranty:"10 Years"},
   description:"DL5.0C can support up to 50 units in parallel and an energy range from 5.12 kWh to 256 kWh."
  },
  {id:"DYN-5.0", brand:"Dyness", category:"Batteries", title:"Dyness STACK 5.1 LIBA LV 0.5C", price:115000,
   img:"Dyness.png",
   specs:{Model:"DL5.0", Capacity:"5.12kWh", Cycles:"6000+ @ 90% DoD", Chemistry:"LiFePO4", Weight: "44 kg", Warranty:"10 Years"},
   description:"DL5.0 supports up to 50 batteries in parallel. OTA updates and monitoring included."
  }
];

let cart = {};

const productsGrid = document.getElementById('productsGrid');
const openCartBtn = document.getElementById('openCartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const floatingCount = document.getElementById('floatingCount');
const checkoutBtn = document.getElementById('checkoutBtn');
const ORDER_EMAIL = 'roy.otieno@roam-electric.com';
const CONTACT_PHONE_DISPLAY = '+254704612435';
const WHATSAPP_PHONE = '254704612435';
const ORDER_CURRENCY = 'KES';
const COMPANY_NAME = 'Roam Electric Limited';
const COMPANY_ADDRESS = ['National Park East Gate Rd.', 'P.O. Box nr 18284', 'Nairobi, 00500', 'Kenya'];
const COMPANY_BANK_DETAILS = [
  ['Email', 'info@roam-electric.com'],
  ['Home Page', 'www.roam-electric.com'],
  ['Phone No.', CONTACT_PHONE_DISPLAY],
  ['VAT Registration No.', 'P05170428D'],
  ['Mpesa Till No.', '9572270'],
  ['Bank', 'Standard Chartered'],
  ['Account No.', '0102487879100 (KES)'],
  ['Account No.', '8702487879100 (USD)'],
  ['Branch', 'Industrial Area 053'],
  ['SWIFT Code', 'SCBLKENXXXX']
];
let logoDataUrlPromise;

const searchInput = document.getElementById('searchInput');
const brandFilter = document.getElementById('brandFilter');
const sortSelect = document.getElementById('sortSelect');

const productModalOverlay = document.getElementById('productModalOverlay');
const productModal = document.getElementById('productModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModalBtn');

// Load cart from localStorage
const savedCart = localStorage.getItem('cart');
if (savedCart) {
  try {
    cart = JSON.parse(savedCart);
  } catch(e) {
    console.error("Error parsing saved cart:", e);
    cart = {};
  }
}

// --- Helper to parse price safely ---
function parsePrice(val) {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^\d.-]/g, '');
    return Number(cleaned) || 0;
  }
  return 0;
}

// Simple plural normalisation used when searching product names.
// Removes a trailing "s" to handle basic plural/singular matching
// (e.g. "inverters" matches "inverter"). Does not cover irregular plurals.
function normalize(text) {
  return text.toLowerCase().replace(/s$/,'');
}

function getCartEntries() {
  return Object.values(cart);
}

function getCartTotal() {
  return getCartEntries().reduce((sum, item) => sum + (item.qty * item.price), 0);
}

function formatMoney(amount) {
  return `${ORDER_CURRENCY} ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatNumber(amount) {
  return amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatInvoiceDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();
}

function buildOrderReference(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const time = [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0')
  ].join('');
  return `RE-${year}${month}${day}-${time}`;
}

function buildInvoiceFilename(orderReference) {
  return `Roam-Pro-Forma-Invoice-${orderReference}.pdf`;
}

function showToast(message, tone = 'success') {
  const palette = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-gray-900'
  };
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded px-4 py-3 text-sm text-white shadow-lg opacity-0 transition-opacity duration-300 ${palette[tone] || palette.info}`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = 1;
  });

  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function setCheckoutBusy(isBusy) {
  const hasItems = getCartEntries().length > 0;
  checkoutBtn.disabled = isBusy || !hasItems;
  checkoutBtn.classList.toggle('opacity-70', isBusy);
  checkoutBtn.classList.toggle('cursor-wait', isBusy);
  checkoutBtn.classList.toggle('opacity-50', !isBusy && !hasItems);
  checkoutBtn.classList.toggle('cursor-not-allowed', !isBusy && !hasItems);
  checkoutBtn.textContent = isBusy ? 'Preparing Invoice...' : 'Export PDF and Email Order';
}

function downloadBlob(blob, filename) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function loadLogoDataUrl() {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch('Roam_Logo.png')
      .then(response => {
        if (!response.ok) {
          throw new Error('Logo file unavailable');
        }
        return response.blob();
      })
      .then(blobToDataUrl)
      .catch(() => null);
  }

  return logoDataUrlPromise;
}

function drawInvoiceHeader(pdf, currentDate, totalPagesPlaceholder) {
  const leftMargin = 20;
  const rightContentEnd = 195;
  const headerRightEdge = pdf.internal.pageSize.getWidth() - 10;

  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('Pro Forma-Invoice', headerRightEdge, 25, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(currentDate, headerRightEdge, 31, { align: 'right' });
  pdf.text(`Page ${pdf.getNumberOfPages()}/${totalPagesPlaceholder}`, headerRightEdge, 36, { align: 'right' });

  const startY = 42;
  const leftAddressLines = [
    'WEBSITE CART ORDER',
    'Product Selection',
    'Generated from',
    'Roam Energy Store'
  ];

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  leftAddressLines.forEach((line, index) => {
    pdf.text(line, leftMargin, startY + (index * 5));
  });

  pdf.text(COMPANY_NAME, headerRightEdge, startY, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  COMPANY_ADDRESS.forEach((line, index) => {
    pdf.text(line, headerRightEdge, startY + 5 + (index * 4.5), { align: 'right' });
  });
}

function drawInvoiceMetadata(pdf, currentDate, orderReference) {
  const leftMargin = 20;
  const rightContentEnd = 195;
  const yStart = 75;
  const leftSide = [
    ['Document No', orderReference],
    ['VAT Registration No.', ''],
    ['Document Date', currentDate],
    ['Currency', ORDER_CURRENCY],
    ['Project Location', 'Nairobi, Kenya'],
    ['Salesperson', 'Website Checkout']
  ];

  leftSide.forEach(([label, value], index) => {
    const y = yStart + (index * 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(label, leftMargin, y);
    pdf.text(value, leftMargin + 45, y);
  });

  const valueX = rightContentEnd;
  COMPANY_BANK_DETAILS.forEach(([label, value], index) => {
    const y = yStart + (index * 5);
    pdf.text(label, 105, y);
    pdf.text(value, valueX, y, { align: 'right' });
  });
}

function drawTableHeader(pdf, y) {
  const leftMargin = 20;
  const columns = [60, 15, 25, 15, 12, 23, 25];
  const headers = ['Item', 'Quantity', 'Unit Price', 'HS Code', 'VAT%', 'VAT Amount', 'Amount'];
  const aligns = ['left', 'center', 'right', 'center', 'center', 'right', 'right'];

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setDrawColor(0, 0, 0);

  let x = leftMargin;
  headers.forEach((header, index) => {
    pdf.line(x, y + 6, x + columns[index], y + 6);
    let textX = x;
    if (aligns[index] === 'center') {
      textX = x + (columns[index] / 2);
    } else if (aligns[index] === 'right') {
      textX = x + columns[index];
    }
    pdf.text(header, textX, y + 4.5, { align: aligns[index] });
    x += columns[index];
  });
}

async function generateInvoicePdf(cartEntries, orderReference) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    throw new Error('PDF library failed to load.');
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const totalPagesPlaceholder = '{total_pages_count_string}';
  const currentDate = formatInvoiceDate(new Date());
  const leftMargin = 20;
  const rightContentEnd = 195;
  const columns = { item: 60, qty: 15, price: 25, hs: 15, vatPercent: 12, vatAmount: 23, amount: 25 };
  const logoDataUrl = await loadLogoDataUrl();

  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, 'PNG', leftMargin, 10, 35, 0);
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(244, 121, 32);
    pdf.text('ROAM', leftMargin, 23);
    pdf.setTextColor(0, 0, 0);
  }

  drawInvoiceHeader(pdf, currentDate, totalPagesPlaceholder);
  drawInvoiceMetadata(pdf, currentDate, orderReference);
  drawTableHeader(pdf, 135);

  let currentY = 143;
  let grandTotal = 0;
  const totalVat = 0;

  cartEntries.forEach(item => {
    const lineTotal = item.qty * item.price;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    const itemTitleLines = pdf.splitTextToSize(item.title, columns.item);
    const rowHeight = (itemTitleLines.length * 5.2) + 3;

    if (currentY + rowHeight > 260) {
      pdf.addPage();
      currentY = 20;
      drawTableHeader(pdf, currentY);
      currentY += 8;
    }

    let x = leftMargin + columns.item;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(String(item.qty), x + (columns.qty / 2), currentY + 4, { align: 'center' });
    x += columns.qty;
    pdf.text(formatNumber(item.price), x + columns.price, currentY + 4, { align: 'right' });
    x += columns.price;
    pdf.text('', x + (columns.hs / 2), currentY + 4, { align: 'center' });
    x += columns.hs;
    pdf.text('0', x + (columns.vatPercent / 2), currentY + 4, { align: 'center' });
    x += columns.vatPercent;
    pdf.text(formatNumber(0), x + columns.vatAmount, currentY + 4, { align: 'right' });
    x += columns.vatAmount;
    pdf.text(formatNumber(lineTotal), x + columns.amount, currentY + 4, { align: 'right' });

    pdf.setFont('helvetica', 'bold');
    pdf.text(itemTitleLines, leftMargin, currentY + 4);

    currentY += rowHeight;
    grandTotal += lineTotal;
  });

  currentY += 5;
  const labelX = rightContentEnd - 60;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Total Amount', labelX, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatNumber(grandTotal), rightContentEnd, currentY, { align: 'right' });

  currentY += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.text('VAT Amount', labelX, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatNumber(totalVat), rightContentEnd, currentY, { align: 'right' });
  pdf.line(labelX, currentY + 1.5, rightContentEnd, currentY + 1.5);

  currentY += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Incl. VAT', labelX, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatNumber(grandTotal + totalVat), rightContentEnd, currentY, { align: 'right' });

  currentY += 12;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.text('This invoice was generated automatically from the Roam Energy website cart.', leftMargin, currentY);

  if (typeof pdf.putTotalPages === 'function') {
    pdf.putTotalPages(totalPagesPlaceholder);
  }

  return {
    blob: pdf.output('blob'),
    filename: buildInvoiceFilename(orderReference),
    total: grandTotal
  };
}

function buildOrderEmailMessage(cartEntries, orderReference, total) {
  const lines = [
    `A new Roam Energy website order has been generated.`,
    '',
    `Order Reference: ${orderReference}`,
    `Recipient Inbox: ${ORDER_EMAIL}`,
    '',
    'Cart Summary:'
  ];

  cartEntries.forEach(item => {
    lines.push(`- ${item.title} x ${item.qty} = ${formatMoney(item.qty * item.price)}`);
  });

  lines.push('');
  lines.push(`Total: ${formatMoney(total)}`);
  lines.push('Attached: Pro forma invoice PDF');

  return lines.join('\n');
}

function buildWhatsAppMessage(cartEntries, orderReference, total, filename) {
  const lines = [
    'Hello Roam, the website checkout email handoff failed.',
    '',
    `Order Reference: ${orderReference}`,
    `Invoice File: ${filename}`,
    '',
    'Cart Summary:'
  ];

  cartEntries.forEach(item => {
    lines.push(`- ${item.title} x ${item.qty} = ${formatMoney(item.qty * item.price)}`);
  });

  lines.push('');
  lines.push(`Total: ${formatMoney(total)}`);
  lines.push('Please see the generated invoice PDF.');

  return lines.join('\n');
}

function openWhatsAppFallback(cartEntries, orderReference, total, filename) {
  const text = encodeURIComponent(buildWhatsAppMessage(cartEntries, orderReference, total, filename));
  const waLink = `https://wa.me/${WHATSAPP_PHONE}?text=${text}`;
  window.open(waLink, '_blank', 'noopener');
}

async function shareInvoiceFile(pdfBlob, filename, cartEntries, orderReference, total) {
  if (!window.isSecureContext || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false;
  }

  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
  if (!navigator.canShare({ files: [pdfFile] })) {
    return false;
  }

  try {
    await navigator.share({
      title: `Roam Energy Order ${orderReference}`,
      text: buildWhatsAppMessage(cartEntries, orderReference, total, filename),
      files: [pdfFile]
    });
    return true;
  } catch (error) {
    if (error && error.name === 'AbortError') {
      return false;
    }
    throw error;
  }
}

async function fallbackToWhatsApp(pdfBlob, filename, cartEntries, orderReference, total) {
  const shared = await shareInvoiceFile(pdfBlob, filename, cartEntries, orderReference, total);
  if (shared) {
    showToast(`Email failed. The invoice PDF was shared from your device; choose WhatsApp and send it to ${CONTACT_PHONE_DISPLAY}.`, 'info');
    return;
  }

  downloadBlob(pdfBlob, filename);
  openWhatsAppFallback(cartEntries, orderReference, total, filename);
  showToast(`Email failed. WhatsApp was opened for ${CONTACT_PHONE_DISPLAY}; attach the downloaded PDF if your browser didn't share it automatically.`, 'info');
}

async function sendInvoiceEmail(pdfBlob, filename, cartEntries, orderReference, total) {
  if (window.location.protocol === 'file:') {
    throw new Error('Email handoff requires the site to be served over http or https.');
  }

  const formData = new FormData();
  formData.append('name', 'Roam Energy Website Checkout');
  formData.append('email', ORDER_EMAIL);
  formData.append('_subject', `New Roam Energy order ${orderReference}`);
  formData.append('_captcha', 'false');
  formData.append('_template', 'table');
  formData.append('_url', window.location.href);
  formData.append('order_reference', orderReference);
  formData.append('order_total', formatMoney(total));
  formData.append('message', buildOrderEmailMessage(cartEntries, orderReference, total));
  formData.append('attachment', pdfBlob, filename);

  const response = await fetch(`https://formsubmit.co/ajax/${ORDER_EMAIL}`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Email handoff failed with status ${response.status}`);
  }

  const data = await response.json().catch(() => null);
  if (data && data.success === false) {
    throw new Error(data.message || 'Email handoff failed.');
  }

  return data;
}

// --- Render Products ---
function renderProducts() {
  const search = searchInput.value.trim().toLowerCase();
  const brand = brandFilter.value;
  const sort = sortSelect.value;

let filtered = PRODUCTS.filter(p => {
  if (brand !== 'All' && p.brand !== brand) return false;

  if (search) {
    const searchNorm = normalize(search.trim());
    const combined = `${p.title} ${p.brand} ${p.category}`;
    const combinedNorm = normalize(combined);
    if (!combinedNorm.includes(searchNorm)) return false;
  }

  return true;
});


  if (sort === 'low') filtered.sort((a,b)=> parsePrice(a.price) - parsePrice(b.price));
  if (sort === 'high') filtered.sort((a,b)=> parsePrice(b.price) - parsePrice(a.price));

  productsGrid.innerHTML = '';
  filtered.forEach((p,i)=>{
    const card = document.createElement('article');
    card.className='bg-white rounded-2xl shadow-md overflow-hidden transition-transform product-card hover:shadow-xl';
    card.style.animation=`popIn .6s cubic-bezier(.22,.9,.32,1) both`;
    card.style.animationDelay=`${i*0.08}s`;
    card.innerHTML=`
      <div class="bg-gray-100 overflow-hidden flex items-center justify-center">
        <img src="${p.img}" alt="${p.title}" class="max-h-48 w-auto object-contain cursor-pointer hover:scale-105 transition-transform" data-id="${p.id}" />
      </div>
      <div class="p-6">
        <h3 class="text-xl font-bold cursor-pointer hover:text-orange-600 transition-colors" data-id="${p.id}">${p.title}</h3>
        <p class="text-sm text-gray-600">${p.category} • ${p.brand}</p>
        <p class="mt-3 text-gray-700">${p.description}</p>
        <p class="mt-3 font-bold text-lg text-orange-600">KES ${p.price.toLocaleString()}</p>
        <div class="mt-4 flex items-center gap-2">
          <button class="bg-gray-200 hover:bg-gray-300 rounded px-3 py-1" data-action="decrease" data-id="${p.id}">-</button>
          <span id="qty-${p.id}">${cart[p.id]?.qty ?? 0}</span>
          <button class="bg-orange-500 hover:bg-orange-600 text-white rounded px-3 py-1" data-action="increase" data-id="${p.id}">+</button>
        </div>
      </div>
    `;
    productsGrid.appendChild(card);
  });

  document.querySelectorAll('[data-action="increase"]').forEach(btn=>btn.onclick=()=>addToCart(btn.dataset.id));
  document.querySelectorAll('[data-action="decrease"]').forEach(btn=>btn.onclick=()=>changeQty(btn.dataset.id,-1));
  document.querySelectorAll('img[data-id],h3[data-id]').forEach(el=>el.onclick=()=>openProductModal(el.dataset.id));
}

function addToCart(productId,count=1){
  const product = PRODUCTS.find(p=>p.id===productId);
  if(!product) return;
  if(!cart[productId]) cart[productId]={...product, qty:0};
  cart[productId].qty += count;
  if(cart[productId].qty <= 0) delete cart[productId];
  updateCartUI();
  updateModalQty(productId);

  const btn = document.querySelector(`[data-action="increase"][data-id="${productId}"]`);
  if (btn) { btn.classList.add('pulse'); setTimeout(()=>btn.classList.remove('pulse'),200); }
}

function changeQty(productId, delta){
  if(!cart[productId]) return;
  cart[productId].qty += delta;
  if(cart[productId].qty <= 0) delete cart[productId];
  updateCartUI();
  updateModalQty(productId);
}

function removeFromCart(productId){
  delete cart[productId];
  updateCartUI();
  updateModalQty(productId);
}

function updateCartUI(){
  cartItemsEl.innerHTML='';
  let total=0;
  const keys=Object.keys(cart);
  if(keys.length===0){
    cartItemsEl.innerHTML='<p class="text-gray-500">Your cart is empty.</p>';
  } else {
    keys.forEach(k=>{
      const it=cart[k];
      const unitLabel = it.qty === 1 ? "Pc" : "Pcs";
      const itemEl=document.createElement('div');
      itemEl.className='flex items-center justify-between border-b pb-3';
      itemEl.innerHTML=`
        <div>
          <div class="font-medium">${it.title}</div>
          <div class="text-sm text-gray-500">KES ${it.price.toLocaleString()} x 
            <input type="number" min="1" value="${it.qty}" class="w-16 text-center border rounded qty-input" data-id="${k}" /> ${unitLabel}
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button class="px-2 bg-gray-200 rounded" onclick="changeQty('${k}',-1)">-</button>
          <button class="px-2 bg-gray-200 rounded" onclick="changeQty('${k}',1)">+</button>
          <button class="ml-2 text-red-500" onclick="removeFromCart('${k}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
      cartItemsEl.appendChild(itemEl);
      total += it.qty*it.price;
    });
  }
  cartTotalEl.textContent=`KES ${total.toLocaleString()}`;
  floatingCount.textContent=keys.reduce((a,k)=>a+cart[k].qty,0);
  checkoutBtn.disabled = keys.length === 0;
  checkoutBtn.classList.toggle('opacity-50', keys.length === 0);
  checkoutBtn.classList.toggle('cursor-not-allowed', keys.length === 0);

  // update product grid quantities
  Object.keys(cart).forEach(id=>{
    const span=document.getElementById(`qty-${id}`);
    if(span) span.textContent=cart[id].qty;
  });
  // Save cart to localStorage
localStorage.setItem('cart', JSON.stringify(cart));
}

// Manual input for cart qty (resets <1 to 1, removes item if 0, rounds decimals up)
document.addEventListener("input", function(e) {
  if (e.target.classList.contains("qty-input")) {
    const id = e.target.dataset.id;
    let val = parseFloat(e.target.value); // allow detecting decimals

    if (isNaN(val)) val = 1; // Reset non-numbers to 1
    val = Math.ceil(val); // Round up decimals

    if (val === 0) {
      // Remove item from cart
      delete cart[id];
      // Remove item element from cart drawer
      const itemEl = e.target.closest('div.flex.items-center.justify-between.border-b.pb-3');
      if (itemEl) itemEl.remove();
      // Update product grid display
      const gridSpan = document.getElementById(`qty-${id}`);
      if (gridSpan) gridSpan.textContent = 0;
      updateModalQty(id);
    } else if (val < 1) {
      val = 1; // Reset any negative or <1 value to 1
      e.target.value = 1; // Update input field visually
      cart[id].qty = 1;
      const gridSpan = document.getElementById(`qty-${id}`);
      if (gridSpan) gridSpan.textContent = 1;
      updateModalQty(id);
    } else {
      cart[id].qty = val;
      e.target.value = val; // Update input visually if rounded
      // Update product grid display
      const gridSpan = document.getElementById(`qty-${id}`);
      if (gridSpan) gridSpan.textContent = val;
      updateModalQty(id);
    }

    // Update subtotal and floating count
    let total = 0;
    Object.values(cart).forEach(it => total += it.qty * it.price);
    cartTotalEl.textContent = `KES ${total.toLocaleString()}`;
    floatingCount.textContent = Object.values(cart).reduce((a, it) => a + it.qty, 0);

    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    const hasItems = Object.keys(cart).length > 0;
    checkoutBtn.disabled = !hasItems;
    checkoutBtn.classList.toggle('opacity-50', !hasItems);
    checkoutBtn.classList.toggle('cursor-not-allowed', !hasItems);

    // Show "cart empty" message if no items left
    if (!hasItems) {
      cartItemsEl.innerHTML = '<p class="text-gray-500">Your cart is empty.</p>';
    }
  }
});



// Automatically select all text when focusing on qty input
document.addEventListener("focus", function(e) {
  if(e.target.classList.contains("qty-input")){
    e.target.select();
  }
}, true); // useCapture=true to catch focus on dynamically added inputs

function updateModalQty(productId){
  const span=document.getElementById(`modal-qty-${productId}`);
  if(span) span.textContent=cart[productId]?.qty ?? 0;
  const gridSpan=document.getElementById(`qty-${productId}`);
  if(gridSpan) gridSpan.textContent=cart[productId]?.qty ?? 0;
}

function openCartDrawer(){
  cartDrawer.classList.remove('drawer-closed');
  cartDrawer.classList.add('drawer-open');
  cartDrawerOverlay.classList.remove('hidden');
}
function closeCartDrawer(){
  cartDrawer.classList.remove('drawer-open');
  cartDrawer.classList.add('drawer-closed');
  cartDrawerOverlay.classList.add('hidden');
}
openCartBtn.onclick=openCartDrawer;
closeCartBtn.onclick=closeCartDrawer;
cartDrawerOverlay.onclick=closeCartDrawer;

function openProductModal(productId){
  const p=PRODUCTS.find(pr=>pr.id===productId);
  if(!p) return;
  modalTitle.textContent=p.title;
  let specsHTML='';
  if(p.specs){
    specsHTML='<ul class="list-disc pl-5 space-y-1">';
    for(const [k,v] of Object.entries(p.specs)){
      specsHTML+=`<li><span class="font-medium">${k}:</span> ${v}</li>`;
    }
    specsHTML+='</ul>';
  }
  modalBody.innerHTML=`
    <img src="${p.img}" alt="${p.title}" class="mx-auto max-h-56 object-contain" />
    <p class="text-gray-700">${p.description}</p>
    <div class="mt-3">${specsHTML}</div>
    <p class="mt-3 text-lg font-bold text-orange-600">KES ${p.price.toLocaleString()}</p>
    <div class="mt-4 flex items-center gap-2">
      <button class="bg-gray-200 hover:bg-gray-300 rounded px-3 py-1" onclick="changeQty('${p.id}',-1)">-</button>
      <span id="modal-qty-${p.id}">${cart[p.id]?.qty ?? 0}</span>
      <button class="bg-orange-500 hover:bg-orange-600 text-white rounded px-3 py-1" onclick="addToCart('${p.id}')">+</button>
    </div>
  `;
  productModalOverlay.classList.remove('hidden');
  productModal.classList.remove('hidden');
  const box=document.getElementById('productModalBox');
  box.classList.remove('modal-out');
  box.classList.add('modal-in');
}
function closeProductModal(){
  const box=document.getElementById('productModalBox');
  box.classList.remove('modal-in');
  box.classList.add('modal-out');
  setTimeout(()=>{
    productModal.classList.add('hidden');
    productModalOverlay.classList.add('hidden');
  },250);
}
closeModalBtn.onclick=closeProductModal;
productModalOverlay.onclick=closeProductModal;

checkoutBtn.onclick = () => {
  handleCheckout();
};

async function handleCheckout() {
  const cartEntries = getCartEntries();
  if (cartEntries.length === 0) {
    showToast('Your cart is empty.', 'error');
    return;
  }

  setCheckoutBusy(true);

  try {
    const orderReference = buildOrderReference(new Date());
    const invoice = await generateInvoicePdf(cartEntries, orderReference);
    try {
      await sendInvoiceEmail(invoice.blob, invoice.filename, cartEntries, orderReference, invoice.total);
      showToast(`Invoice emailed to ${ORDER_EMAIL}.`);
    } catch (emailError) {
      console.error('Email handoff failed:', emailError);
      if (emailError && typeof emailError.message === 'string' && emailError.message.includes('http or https')) {
        showToast('Email sending needs the site to run through Live Server or another http/https host. Switching to WhatsApp fallback.', 'info');
      }
      await fallbackToWhatsApp(invoice.blob, invoice.filename, cartEntries, orderReference, invoice.total);
    }
  } catch (error) {
    console.error('Checkout failed:', error);
    showToast('Could not export the order PDF. Please try again.', 'error');
  } finally {
    setCheckoutBusy(false);
  }
}
// --- PERSIST SEARCH/FILTER/SORT SETTINGS ---
searchInput.oninput = () => {
  localStorage.setItem('searchTerm', searchInput.value);
  renderProducts();
};
brandFilter.onchange = () => {
  localStorage.setItem('selectedBrand', brandFilter.value);
  renderProducts();
};
sortSelect.onchange = () => {
  localStorage.setItem('sortOrder', sortSelect.value);
  renderProducts();
};

// --- LOAD SAVED SETTINGS ON PAGE LOAD ---
window.addEventListener('DOMContentLoaded', () => {
  const savedSearch = localStorage.getItem('searchTerm');
  const savedBrand = localStorage.getItem('selectedBrand');
  const savedSort = localStorage.getItem('sortOrder');

  if (savedSearch) searchInput.value = savedSearch;
  if (savedBrand) brandFilter.value = savedBrand;
  if (savedSort) sortSelect.value = savedSort;

  renderProducts();
});

// --- Initialize UI ---
updateCartUI();
