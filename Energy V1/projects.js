// ─── Supabase config ───────────────────────────────────────────────────────
const SUPABASE_URL      = 'https://akbmydsqorsoijxsmwrh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYm15ZHNxb3Jzb2lqeHNtd3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzgyNDMsImV4cCI6MjA5NDYxNDI0M30.7zqrrNdn4golHcw9IFhFZemxfu0NGzdhqHPdflxSbSU';

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

function transformProject(row) {
  const typeMap = { 'grid-tied': 'Grid-Tied', 'off-grid': 'Off-Grid', 'hybrid': 'Hybrid' };
  let completed = 'N/A';
  if (row.completed_at) {
    const d = new Date(row.completed_at);
    completed = `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  return {
    id:          row.id,
    name:        row.title,
    images:      row.image_url ? [row.image_url] : [],
    location:    row.location,
    type:        typeMap[row.type] || row.type,
    size:        row.size_kwp   ? `${row.size_kwp} kWp`   : 'N/A',
    storage:     row.storage_kwh ? `${row.storage_kwh} kWh` : 'N/A',
    completed,
    description: row.description || '',
    results:     '',
  };
}

async function fetchProjects() {
  const url = `${SUPABASE_URL}/rest/v1/projects?select=*&active=eq.true&order=sort_order.asc`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  if (!res.ok) throw new Error('Failed to load projects');
  const rows = await res.json();
  return rows.map(transformProject);
}

// ─── Projects Data (loaded from Supabase) ──────────────────────────────────
let projects = [];

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
function renderCards() {
  grid.innerHTML = '';
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
} // end renderCards

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

// ─── Boot: load from Supabase then render ──────────────────────────────────
(async () => {
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--clr-muted,#6b7280);">
        <i class="fas fa-spinner fa-spin" style="font-size:1.8rem;opacity:.5;display:block;margin-bottom:12px;"></i>
        <p>Loading projects…</p>
      </div>`;
  }
  try {
    projects = await fetchProjects();
    renderCards();
  } catch (e) {
    console.error('Could not load projects:', e);
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--clr-muted,#6b7280);">
          <i class="fas fa-exclamation-circle" style="font-size:1.8rem;opacity:.4;display:block;margin-bottom:12px;"></i>
          <p>Could not load projects. Please refresh the page.</p>
        </div>`;
    }
  }
})();
