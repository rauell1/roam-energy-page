// ─── Projects Data ─────────────────────────────────────────────────────────
const projects = [
  {
    id: 'emboo-river',
    name: 'Emboo River Camp',
    images: ['Emboo River1.jpg', 'Emboo River.jpg'],
    location: 'Maasai Mara National Park, Narok County',
    type: 'Off-Grid',
    size: '64.31 kWp',
    storage: '153.6 kWh lithium-ion',
    completed: 'January 2023',
    results: 'Provides 100% off-grid power for a remote luxury eco-camp in the Mara.',
    description: 'Roam Energy implemented a fully off-grid solar PV system with substantial lithium-ion battery storage to supply electricity sustainably deep inside the Maasai Mara National Park. The system eliminated diesel generator dependence entirely, reducing noise pollution and operational costs while ensuring uninterrupted power for guests.'
  },
  {
    id: 'roam-park',
    name: 'Roam Park',
    images: ['Roam Park.png'],
    location: 'Nairobi, Kenya',
    type: 'Grid-Tied',
    size: '55.78 kWp',
    storage: 'N/A',
    completed: 'August 2021',
    results: 'Efficient energy generation using Jinko 575W panels and SMA inverters.',
    description: 'Roam Energy installed a 55.78 kWp grid-tied solar PV system at Roam Park, featuring premium Jinko 575W solar panels and SMA Sunny Tripower Core inverters. The system feeds excess generation back into the grid and significantly reduces the facility\'s electricity costs.'
  },
  {
    id: 'carton-manufacturers',
    name: 'Carton Manufacturers',
    images: ['Carton Manufacturers.jpg', 'Carton 3.jpg'],
    location: 'Nairobi, Kenya',
    type: 'Commercial',
    size: '403 kWp / 400 kVA',
    storage: 'N/A',
    completed: 'March 2022',
    results: 'High-capacity rooftop system offsets the majority of facility energy consumption.',
    description: 'Roam Energy delivered and commissioned a large-scale 403 kWp / 400 kVA rooftop grid-tied solar PV system for Carton Manufacturers Ltd. This flagship commercial installation demonstrates the viability of solar power for heavy manufacturing environments in Nairobi.'
  },
  {
    id: 'sekanani-camp',
    name: 'Sekanani Camp',
    images: ['Sekanani Camp1.png', 'Sekanani Camp.png'],
    location: 'Maasai Mara National Park, Narok County',
    type: 'Off-Grid',
    size: '10.34 kWp',
    storage: '25.6 kWh battery',
    completed: 'November 2022',
    results: 'Reliable off-grid energy for camp operations, eliminating generator use.',
    description: 'Roam Energy installed a compact but complete off-grid solar PV system at Sekanani Camp, a safari camp located in the Maasai Mara. The system provides 24/7 power for accommodation, lighting, water pumping, and communications without any grid connection.'
  },
  {
    id: 'carl-martens',
    name: 'Carl Martens Residence',
    images: ['Carl Martens1.png', 'Carl Martens.png'],
    location: 'Ukunda, Kwale County, Kenya',
    type: 'Grid-Tied',
    size: '10.45 kWp',
    storage: '15.36 kWh battery',
    completed: 'June 2023',
    results: 'Enhanced energy independence and significantly reduced grid reliance.',
    description: 'Roam Energy designed and installed a hybrid grid-tied solar PV system with battery backup for a private residence in Ukunda, on the Kenya coast. The system provides clean energy during the day, stores surplus in batteries for evening use, and maintains grid connectivity as a backup — delivering genuine energy independence.'
  }
];

// ─── Tag colours ───────────────────────────────────────────────────────────
const tagClass = {
  'Off-Grid':   'proj-card-tag--offgrid',
  'Commercial': 'proj-card-tag--commercial',
  'Grid-Tied':  '',
};

// ─── DOM refs ──────────────────────────────────────────────────────────────
const grid           = document.getElementById('projects-grid');
const modalOverlay   = document.getElementById('project-modal-overlay');
const modalWrap      = document.getElementById('project-modal');
const modalImage     = document.getElementById('modal-image');
const modalContent   = document.getElementById('modal-content');
const closeModalBtn  = document.getElementById('closeProjectModal');
const prevBtn        = document.getElementById('prevImage');
const nextBtn        = document.getElementById('nextImage');
const carouselDots   = document.getElementById('carousel-dots');

let currentProject = null;
let currentIndex   = 0;

// ─── Render cards ──────────────────────────────────────────────────────────
projects.forEach((p, cardIdx) => {
  const card = document.createElement('div');
  card.className = 'proj-card';
  card.style.animationDelay = `${cardIdx * 80}ms`;

  const hasMultiple = p.images.length > 1;
  const tc = tagClass[p.type] || '';

  card.innerHTML = `
    <div class="proj-card-media">
      <img id="card-img-${p.id}" src="${p.images[0]}" alt="${p.name}" loading="lazy">
      <span class="proj-card-tag ${tc}">${p.type}</span>
      ${hasMultiple ? `
        <button class="card-nav card-nav--prev" data-id="${p.id}" data-dir="-1" aria-label="Previous">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="card-nav card-nav--next" data-id="${p.id}" data-dir="1" aria-label="Next">
          <i class="fas fa-chevron-right"></i>
        </button>
        <span class="card-img-count" id="card-count-${p.id}">1 / ${p.images.length}</span>
      ` : ''}
    </div>
    <div class="proj-card-body">
      <h3>${p.name}</h3>
      <p class="proj-card-location">
        <i class="fas fa-map-marker-alt"></i> ${p.location}
      </p>
      <div class="proj-card-specs">
        <div class="proj-spec"><i class="fas fa-bolt"></i> ${p.size}</div>
        ${p.storage !== 'N/A' ? `<div class="proj-spec"><i class="fas fa-battery-three-quarters"></i> ${p.storage}</div>` : ''}
      </div>
      <div class="proj-card-footer">
        <span class="proj-card-date"><i class="fas fa-calendar-alt"></i> ${p.completed}</span>
        <button class="btn btn-primary btn-sm" data-open="${p.id}">
          View Details <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>`;

  grid.appendChild(card);
});

// ─── Card image cycling ────────────────────────────────────────────────────
const cardIndexes = {};

grid.addEventListener('click', e => {
  const navBtn = e.target.closest('[data-dir]');
  if (navBtn) {
    e.stopPropagation();
    const id  = navBtn.dataset.id;
    const dir = parseInt(navBtn.dataset.dir, 10);
    const p   = projects.find(x => x.id === id);
    if (!p) return;
    if (cardIndexes[id] === undefined) cardIndexes[id] = 0;
    cardIndexes[id] = (cardIndexes[id] + dir + p.images.length) % p.images.length;
    const img = document.getElementById(`card-img-${id}`);
    if (img) { img.style.opacity = '0.6'; img.src = p.images[cardIndexes[id]]; img.onload = () => { img.style.opacity = '1'; }; }
    const counter = document.getElementById(`card-count-${id}`);
    if (counter) counter.textContent = `${cardIndexes[id] + 1} / ${p.images.length}`;
    return;
  }

  const openBtn = e.target.closest('[data-open]');
  if (openBtn) openModal(openBtn.dataset.open);
});

// ─── Modal ─────────────────────────────────────────────────────────────────
function openModal(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;

  currentProject = p;
  currentIndex   = 0;

  modalImage.src = p.images[0];
  updateDots();
  updateCarouselBtns();

  const tc = tagClass[p.type] || '';
  modalContent.innerHTML = `
    <p class="modal-project-title">${p.name}</p>
    <p class="modal-project-location">
      <i class="fas fa-map-marker-alt"></i> ${p.location}
    </p>
    <div class="modal-project-grid">
      <div class="modal-stat">
        <p class="modal-stat-label">System Size</p>
        <p class="modal-stat-value">${p.size}</p>
      </div>
      <div class="modal-stat">
        <p class="modal-stat-label">Battery Storage</p>
        <p class="modal-stat-value">${p.storage}</p>
      </div>
      <div class="modal-stat">
        <p class="modal-stat-label">System Type</p>
        <p class="modal-stat-value">${p.type}</p>
      </div>
      <div class="modal-stat">
        <p class="modal-stat-label">Completed</p>
        <p class="modal-stat-value">${p.completed}</p>
      </div>
    </div>
    <p class="modal-project-desc">${p.description}</p>
    <div class="modal-project-actions">
      <button class="btn btn-outline-primary" id="modal-close-btn">Close</button>
      <a href="products.html" class="btn btn-primary">
        <i class="fas fa-solar-panel"></i> Get a Quote
      </a>
    </div>`;

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);

  modalOverlay.classList.add('open');
  modalWrap.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  modalWrap.classList.remove('open');
  document.body.style.overflow = '';
}

function updateDots() {
  carouselDots.innerHTML = '';
  if (!currentProject) return;
  currentProject.images.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = `carousel-dot${i === currentIndex ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Image ${i + 1}`);
    dot.addEventListener('click', () => { currentIndex = i; setModalImage(); });
    carouselDots.appendChild(dot);
  });
}

function updateCarouselBtns() {
  if (!currentProject) return;
  const hasMany = currentProject.images.length > 1;
  prevBtn.style.display = hasMany ? '' : 'none';
  nextBtn.style.display = hasMany ? '' : 'none';
  carouselDots.style.display = hasMany ? '' : 'none';
}

function setModalImage() {
  modalImage.style.opacity = '0.5';
  modalImage.src = currentProject.images[currentIndex];
  modalImage.onload = () => { modalImage.style.opacity = '1'; };
  updateDots();
}

prevBtn.addEventListener('click', () => {
  if (!currentProject) return;
  currentIndex = (currentIndex - 1 + currentProject.images.length) % currentProject.images.length;
  setModalImage();
});

nextBtn.addEventListener('click', () => {
  if (!currentProject) return;
  currentIndex = (currentIndex + 1) % currentProject.images.length;
  setModalImage();
});

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
