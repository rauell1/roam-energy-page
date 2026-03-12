

const projects = [
  {
    name: "Emboo River 2",
    images: ["Emboo River1.jpg","Emboo River.jpg"],
    location: "Maasai Mara, Kenya (Maasai Mara National Park, Narok County)",
    size: "64.31 kWp off-grid solar PV system with 153.6 kWh lithium-ion battery storage",
    completed: "January 2023",
    results: "Provides reliable off-grid power for a remote area",
    description: "Roam Energy implemented an off-grid solar PV system with substantial battery storage to supply electricity sustainably in the heart of Maasai Mara National Park."
  },
  {
    name: "Roam Park",
    images: ["Roam Park.png"],
    location: "Nairobi, Kenya",
    size: "55.78 kWp grid-tied solar PV system",
    completed: "August 2021",
    results: "Efficient energy generation using advanced solar panels and inverters",
    description: "Roam Energy installed a 55.78 kWp grid-tied solar PV system featuring Jinko 575W solar panels and SMA Sunny Tripower Core inverters at Roam Park."
  },
  {
    name: "Carton Manufacturers",
    images: ["Carton Manufacturers.jpg","Carton 3.jpg"],
    location: "Nairobi, Kenya",
    size: "403kWp / 400kVA rooftop grid-tied Solar PV System",
    completed: "March 2022",
    results: "Successfully delivered a high-capacity rooftop solar system to offset energy consumption",
    description: "Roam Energy delivered and installed a 403 kWp/400 kVA rooftop grid-tied solar PV system for Carton Manufacturers Ltd., providing a reliable and sustainable energy solution."
  },
  {
    name: "Sekanani Camp",
    images: ["Sekanani Camp1.png","Sekanani Camp.png"],
    location: "Maasai Mara, Kenya (Maasai Mara National Park, Narok County)",
    size: "10.34 kWp off-grid solar PV system with 25.6 kWh battery storage",
    completed: "November 2022",
    results: "Ensured reliable off-grid energy for camp operations",
    description: "Roam Energy installed an off-grid solar PV system to meet the energy needs of Sekanani Camp, supporting sustainable tourism in a remote area."
  },
  {
    name: "Carl Martens - Residential Solar PV System",
    images: ["Carl Martens1.png","Carl Martens.png"],
    location: "Ukunda, Kwale County, Kenya",
    size: "10.45 kWp grid-tied solar PV system with 15.36 kWh battery storage",
    completed: "June 2023",
    results: "Enhanced energy independence and reduced reliance on the grid",
    description: "Roam Energy delivered a residential solar PV system with battery storage for a private residence in Ukunda, offering reliable and clean energy solutions."
  }
];

const projectsGrid = document.getElementById("projects-grid");

// Scroll animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("fade-in-up");
      entry.target.classList.remove("opacity-0");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

// Render project cards
projects.forEach((project) => {
  const safeId = project.name.replace(/\s+/g, '');
  const card = document.createElement("div");
  card.className = "project-card bg-white rounded-2xl shadow-md border border-gray-200 transition-all duration-300 opacity-0 cursor-pointer hover:scale-[1.03] hover:shadow-2xl hover:border-orange-400 hover:bg-orange-50";
  card.innerHTML = `
    <div class="relative group">
      <img id="${safeId}-img" 
        src="${project.images[0]}" 
        alt="${project.name}" 
        loading="lazy"
        class="w-full h-48 object-cover rounded-t-2xl transform transition-transform duration-500 group-hover:scale-105">

      <!-- Prev Arrow -->
      ${project.images.length > 1 ? `
      <button onclick="cycleImage('${project.name}', -1)"
        class="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition">
        &lt;
      </button>` : ''}

      <!-- Next Arrow -->
      ${project.images.length > 1 ? `
      <button onclick="cycleImage('${project.name}', 1)"
        class="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition">
        &gt;
      </button>` : ''}
    </div>

    <div class="p-4">
      <h3 class="text-xl font-semibold mb-2">${project.name}</h3>
      <p class="text-sm text-gray-600 mb-2"><strong>Location:</strong> ${project.location}</p>
      <p class="text-sm text-gray-600 mb-2"><strong>Size:</strong> ${project.size}</p>
      <button onclick="openProjectModal('${project.name}')"
        class="mt-4 inline-block px-4 py-2 bg-orange-500 text-white rounded-xl shadow hover:bg-orange-600 transition">
        View Details
      </button>
    </div>
  `;

  projectsGrid.appendChild(card);
  observer.observe(card);
});

// Cycle images inside cards
function cycleImage(projectName, direction) {
  const project = projects.find(p => p.name === projectName);
  if (!project) return;

  if (project.cardIndex === undefined) project.cardIndex = 0;

  project.cardIndex = (project.cardIndex + direction + project.images.length) % project.images.length;

  const imgEl = document.getElementById(project.name.replace(/\s+/g, '') + "-img");
  if (imgEl) imgEl.src = project.images[project.cardIndex];
}

let currentIndex = 0;
let currentProject = null;

// Modal open
function openProjectModal(name) {
  const modal = document.getElementById("project-modal");
  const title = document.getElementById("modal-title");
  const content = document.getElementById("modal-content");
  const imgEl = document.getElementById("modal-image");
  const prevBtn = document.getElementById("prevImage");
  const nextBtn = document.getElementById("nextImage");

  currentProject = projects.find((p) => p.name === name);
  currentIndex = 0;

  if (!currentProject) return;

  title.textContent = currentProject.name;
  imgEl.src = currentProject.images[currentIndex];

  content.innerHTML = `
    <p><strong>Location:</strong> ${currentProject.location}</p>
    <p><strong>System Size:</strong> ${currentProject.size}</p>
    <p><strong>Completed:</strong> ${currentProject.completed}</p>
    <p><strong>Results:</strong> ${currentProject.results}</p>
    <p class="mt-2">${currentProject.description}</p>
  `;

  // 🔑 Only show arrows if more than one image
  if (currentProject.images.length > 1) {
    prevBtn.classList.remove("hidden");
    nextBtn.classList.remove("hidden");
  } else {
    prevBtn.classList.add("hidden");
    nextBtn.classList.add("hidden");
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}


// Modal close
function closeProjectModal() {
  const modal = document.getElementById("project-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// Modal navigation
document.getElementById("prevImage").addEventListener("click", () => {
  if (!currentProject) return;
  currentIndex = (currentIndex - 1 + currentProject.images.length) % currentProject.images.length;
  document.getElementById("modal-image").src = currentProject.images[currentIndex];
});

document.getElementById("nextImage").addEventListener("click", () => {
  if (!currentProject) return;
  currentIndex = (currentIndex + 1) % currentProject.images.length;
  document.getElementById("modal-image").src = currentProject.images[currentIndex];
});

// Close modal if clicking outside
const modal = document.getElementById("project-modal");
modal.addEventListener("click", (e) => { if (e.target === modal) closeProjectModal(); });

// Escape key
document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") closeProjectModal();
});

