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

// --- Render Products ---
function renderProducts() {
  const search = searchInput.value.trim().toLowerCase();
  const brand = brandFilter.value;
  const sort = sortSelect.value;

function normalize(text) {
  return text.toLowerCase().replace(/s$/,''); // simple plural handling
}

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

    // Show "cart empty" message if no items left
    if (Object.keys(cart).length === 0) {
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
  if (Object.keys(cart).length === 0) {
    alert("Your cart is empty!");
    return;
  }

  let msg = "Hello Roam! I would like to order the following products:\n\n";
  let total = 0;

  Object.values(cart).forEach(it => {
    const unitLabel = it.qty === 1 ? "Pc" : "Pcs";
    msg += `- ${it.title} x ${it.qty} ${unitLabel} = KES ${(it.price * it.qty).toLocaleString()}\n`;
    total += it.price * it.qty;
  });

  msg += `\nTotal: KES ${total.toLocaleString()}`;
  const encodedMsg = encodeURIComponent(msg);
  //const waLink = `https://api.whatsapp.com/send?phone=254704612435&text=${encodedMsg}`;
  // const waLink = `https://wa.me/254704612435?text=${encodedMsg}`;
let waLink = `https://api.whatsapp.com/send?phone=254704612435&text=${encodedMsg}`;
window.open(waLink, '_blank');
  // Create toast
  const toast = document.createElement("div");
  toast.textContent = "Redirecting to WhatsApp...";
  toast.className = "fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 opacity-0 transition-opacity duration-500";
  document.body.appendChild(toast);

  // Fade in
  setTimeout(() => toast.style.opacity = 1, 10);

  // Fade out and redirect
  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => {
      toast.remove();
      // Open WhatsApp in a new tab instead of leaving the page
      window.open(waLink, '_blank');
    }, 500);
  }, 1800); // keep visible for 1.8s
};
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