const WHATSAPP_NUMBER = (window.ROAM_WHATSAPP_NUMBER || '+254704612435').replace(/\D/g, '');
const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

function buildWhatsAppLink(message) {
  const params = new URLSearchParams({ app_absent: '0' });
  if (message) params.set('text', message);
  return `${WHATSAPP_BASE_URL}?${params.toString()}`;
}

window.ROAM_WHATSAPP_NUMBER = WHATSAPP_NUMBER;

// Initialize AOS animation
AOS.init({ duration: 800, once: true });

// Testimonial carousel
const carousel = document.querySelector('.testimonial-carousel');
const slides = document.querySelectorAll('.testimonial-slide');
const dots = document.querySelectorAll('.testimonial-dot');
let currentIndex = 0;

function updateCarousel() {
  const slideWidth = slides[0].offsetWidth;
  carousel.scrollTo({ left: currentIndex * slideWidth, behavior: 'smooth' });
  dots.forEach((dot, index) => {
    dot.classList.toggle('bg-blue-600', index === currentIndex);
    dot.classList.toggle('bg-gray-300', index !== currentIndex);
  });
}

document.querySelector('.testimonial-prev').addEventListener('click', () => {
  currentIndex = (currentIndex > 0) ? currentIndex - 1 : slides.length - 1;
  updateCarousel();
});

document.querySelector('.testimonial-next').addEventListener('click', () => {
  currentIndex = (currentIndex < slides.length - 1) ? currentIndex + 1 : 0;
  updateCarousel();
});

dots.forEach((dot, index) => {
  dot.addEventListener('click', () => { currentIndex = index; updateCarousel(); });
});

const whatsappBtn = document.getElementById('whatsapp-btn');
if (whatsappBtn) {
  whatsappBtn.href = buildWhatsAppLink('Hi Roy, I would like to know more about your products');
  whatsappBtn.rel = 'noopener noreferrer';
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
  });
});

document.querySelectorAll('.faq-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const content = button.nextElementSibling;
    const icon = button.querySelector('i');

    // Close all open FAQ contents first
    document.querySelectorAll('.faq-content').forEach(faq => {
      if (faq !== content) {
        faq.classList.add('hidden');
      }
    });

    // Reset all icons
    document.querySelectorAll('.faq-toggle i').forEach(i => {
      if (i !== icon) {
        i.classList.remove('rotate-180');
      }
    });

    // Toggle the clicked one
    content.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
  });
});

// Improved Floating WhatsApp button visibility
if (whatsappBtn) {
  window.addEventListener('scroll', function () {
    const atBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 10);
    whatsappBtn.style.display = atBottom ? 'block' : 'none';
  });
}
