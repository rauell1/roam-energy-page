# Roam Energy — Codebase Map

> Architecture reference for developers and AI agents working in this repo.

---

## High-Level Architecture

```
Browser
  │
  ├── GET /            → Energy V1/index.html   (Vercel static)
  ├── GET /products.html → Energy V1/products.html
  ├── GET /projects.html → Energy V1/projects.html
  │
  └── POST /api/checkout → api/checkout.js      (Vercel Serverless)
                               │
                               ├── MongoDB Atlas  (order storage)
                               ├── Resend API     (email + PDF)
                               └── WhatsApp API   (notification)
```

---

## File Responsibilities

### Frontend

#### `Energy V1/index.html`
Main landing page. Self-contained HTML with inline Tailwind CDN. Sections: nav, hero, about, products, projects, FAQ, testimonials, map, CTA, contact form, footer.

**Key dependencies loaded:**
- `https://cdn.tailwindcss.com`
- `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`
- `https://unpkg.com/aos@2.3.1/dist/aos.{css,js}`
- `style.css` (local)
- `script.js` (local)

#### `Energy V1/style.css`
Global custom styles for index.html:
- CSS custom properties (design tokens)
- `.hero-image` — full-viewport background image
- `.gradient-bg` — light gradient for alternating sections
- `.product-card` — hover scale effect
- `.project-card` — hover effect
- `.testimonial-carousel` — scroll-snap carousel
- `.faq-content` — accordion toggle
- Responsive breakpoints (768px mobile threshold)

#### `Energy V1/script.js`
Shared utilities used by index.html:
- `AOS.init()` — scroll animations
- Mobile menu toggle
- Testimonial carousel (prev/next/dots)
- FAQ accordion toggle
- Floating WhatsApp button visibility (shows after scroll)
- Smooth scroll

#### `Energy V1/products.html`
Product catalog with full shopping flow. Loads `products.css` and `products.js`.

**Key CDN libs:**
- `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`
- Font Awesome, AOS

**Sections:** hero banner, search/filter bar, product grid, cart drawer, customer form, checkout button.

#### `Energy V1/products.js`
All products page logic (~500 lines):

| Function / Concept | Purpose |
|--------------------|---------|
| `products[]` | Hardcoded array of 7 product objects |
| `renderProducts()` | Renders filtered/sorted product cards into grid |
| `addToCart(id)` | Adds item to cart state, updates badge |
| `renderCart()` | Renders cart drawer line items |
| `openModal(id)` | Opens product detail modal |
| `generatePDF()` | Builds jsPDF pro-forma invoice |
| `submitOrder()` | POSTs to `/api/checkout` with PDF + customer data |
| Filter/sort handlers | Brand filter chips + price sort select |

#### `Energy V1/products.css`
Styles specific to the products page:
- Filter chip active states
- Product modal overlay
- Cart drawer slide animation
- Quantity stepper buttons

#### `Energy V1/projects.html`
Project showcase with 5 case studies. Loads `projects.css` and `projects.js`.

#### `Energy V1/projects.js`
Projects page logic:
- `projectsData[]` — 5 project objects with image arrays
- Image carousel per card (prev/next navigation)
- `IntersectionObserver` for fade-in-up scroll animations
- `openModal(id)` / `closeModal()` for detail popup

#### `Energy V1/projects.css`
Styles for project cards, image carousel, and modal.

---

### Backend

#### `api/checkout.js`
Vercel serverless function. Single exported `handler(req, res)`:

```
Request → CORS check → API key auth → Rate limit → Validate payload
       → MongoDB insert → Resend email (+ PDF) → WhatsApp notify
       → 200 OK
```

Error handling: each external call is wrapped; partial failures return 502.

#### `api/config.js`
Reads all env vars at import time. Exports `appConfig` object. Throws on missing required vars so the function fails fast at cold-start rather than mid-request.

---

### Configuration

#### `vercel.json`
```json
{
  "rewrites": [
    { "source": "/api/(.*)",  "destination": "/api/$1" },
    { "source": "/(.*)",      "destination": "/Energy V1/$1" }
  ]
}
```
The space in `Energy V1` is URL-safe within Vercel's internal routing.

#### `package.json`
- `"type": "module"` — all JS files use ES module syntax (`import`/`export`)
- `"engines": { "node": ">=18" }` — required for Vercel runtime

---

### AI Tooling (`.github/prompts/`)

#### `ui-ux-pro-max/`
Python-based BM25 search engine over 24 CSV design-system files. Not used at runtime — developer tool only.

```
python search.py "landing page hero" --design-system html-tailwind --page index
```

#### `daily-updates-checker/`
Prompt template for a daily repo review pass (changes, deps, broken refs).

---

## Data Flow — Checkout

```
1. User fills cart in products.html
2. User enters name / email / phone
3. products.js generates PDF via jsPDF (client-side)
4. products.js calls POST /api/checkout with:
   - user object
   - cart array
   - base64 PDF
   - order reference (ORD-YYYYMMDD-NNN)
5. api/checkout.js:
   a. Validates auth + rate limit
   b. Inserts order doc to MongoDB
   c. Sends confirmation email via Resend (PDF attached)
   d. Uploads PDF to WhatsApp Media API
   e. Sends WhatsApp document message to recipient
6. products.js shows success / error toast
```

---

## Image Assets (`Energy V1/`)

| File | Used In | Description |
|------|---------|-------------|
| `Roam_Logo.png` | All pages (nav) | Roam Energy logo |
| `Dyness A.jpg` | index + products | Dyness battery product shot |
| `Deye A.jpg` | index + products | Deye inverter product shot |
| `Dyness.png` | products | Dyness branding |
| `Roam Park.png` | index + projects | Roam Park project |
| `Emboo River.jpg` | index + projects | Emboo River project |
| `Emboo River1.jpg` | projects | Emboo River (alt view) |
| `Sekanani Camp.png` | index + projects | Sekanani Camp |
| `Sekanani Camp1.png` | projects | Sekanani Camp (alt view) |
| `Carl Martens.png` | projects | Carl Martens project |
| `Carl Martens1.png` | projects | Carl Martens (alt view) |
| `Carton 3.jpg` | projects | Carton Manufacturers |
| `Carton Manufacturers.jpg` | projects | Carton Manufacturers (alt) |

---

## Known Constraints

- **No build step** — Tailwind is CDN-only; no purging or custom config
- **No TypeScript** — plain JS throughout
- **PDF is client-generated** — large base64 payloads in checkout request (~200KB typical)
- **WhatsApp recipient is hardcoded** in env var `WHATSAPP_RECIPIENT` (not customer's number)
- **FormSubmit.co** used for contact form (no backend needed); `_next` redirect URL is placeholder
- **Folder name has a space** (`Energy V1`) — do not rename without updating `vercel.json`
