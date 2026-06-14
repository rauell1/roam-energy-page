# Roam Energy — Sitemap

> Live base URL: https://roam-energy.vercel.app

---

## Pages

| URL | File | Description |
|-----|------|-------------|
| `/` | `Energy V1/index.html` | Landing page — hero, about, products, projects, FAQ, testimonials, contact |
| `/products.html` | `Energy V1/products.html` | Product catalog with cart, PDF quote generation, and checkout |
| `/projects.html` | `Energy V1/projects.html` | Reference project showcase with modal gallery |

---

## API Endpoints

| Method | URL | File | Description |
|--------|-----|------|-------------|
| POST | `/api/checkout` | `api/checkout.js` | Submit quote order → MongoDB + email + WhatsApp |

---

## Page Sections — index.html

```
/ (index.html)
├── #nav          Navigation bar (sticky, dark)
├── #hero         Full-viewport hero image + headline + CTA
├── #about        Mission statement + 3 feature pillars
├── #products     3 product teasers (panels, batteries, inverters)
├── #projects     3 featured reference projects
├── #faq          5 expandable FAQ items
├── #testimonials 3 client testimonials
├── #map          Google Maps embed (Roam Park, Nairobi)
├── #cta          Orange full-width CTA strip
├── #contact      Contact info + contact form (FormSubmit)
└── #footer       Logo, quick links, products, newsletter
```

---

## Page Sections — products.html

```
/products.html
├── #nav          Navigation bar (shared)
├── #hero         Products hero banner
├── #filters      Search + brand filter + sort controls
├── #product-grid 7 product cards
├── #cart-drawer  Slide-out cart sidebar
├── #checkout     Customer details form + PDF generation
└── #footer       Footer (shared)
```

---

## Page Sections — projects.html

```
/projects.html
├── #nav          Navigation bar (shared)
├── #hero         Projects hero banner
├── #project-grid 5 project cards with image carousels
├── #modal        Full-detail project modal
└── #footer       Footer (shared)
```

---

## External Links

| Destination | Purpose |
|-------------|---------|
| `https://www.roam-electric.com/` | Parent brand homepage |
| `https://wa.me/254704612435` | WhatsApp direct chat |
| `mailto:energy@roam-electric.com` | Email contact |
| `tel:+254704612435` | Phone CTA |
| Google Maps embed | Roam Park location |

---

## Routing (vercel.json)

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)",     "destination": "/Energy V1/$1" }
  ]
}
```

All non-API requests are served from `Energy V1/`. The folder name space is handled by Vercel's rewrite rules.
