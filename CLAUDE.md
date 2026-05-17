# Roam Energy — CLAUDE.md

> **Auto-updated on every commit via `.git/hooks/post-commit`**
> Last updated: 2026-05-17 19:29 UTC

---

## Project Overview

**Roam Energy** is a solar energy sub-brand of [Roam Electric](https://www.roam-electric.com/), serving homes, businesses, and communities across Africa with premium solar panels, hybrid inverters, and lithium battery storage.

- **Live URL:** https://roam-energy.vercel.app/
- **Repo:** https://github.com/rauell1/roam-energy-page
- **Platform:** Vercel (static frontend + serverless API)
- **Contact:** energy@roam-electric.com | +254 704 612 435

---

## Repository Structure

```
roam-energy-page/
├── Energy V1/          ← Frontend (HTML/CSS/JS, served at /)
│   ├── index.html      ← Landing page
│   ├── products.html   ← Product catalog + cart + checkout
│   ├── projects.html   ← Reference project showcase
│   ├── style.css       ← Global styles (index)
│   ├── products.css    ← Products page styles
│   ├── projects.css    ← Projects page styles
│   ├── script.js       ← Shared utilities (AOS, FAQ, WhatsApp)
│   ├── products.js     ← Cart, PDF generation, checkout API call
│   ├── projects.js     ← Project modal gallery
│   └── *.{png,jpg}     ← Local image assets
├── api/
│   ├── checkout.js     ← POST /api/checkout (Vercel function)
│   └── config.js       ← Environment variable loader
├── .github/
│   └── prompts/        ← AI prompt utilities (BM25 UI/UX search)
├── CLAUDE.md           ← This file (auto-updated on commit)
├── SITEMAP.md          ← Page & URL map
├── CODEBASE_MAP.md     ← Architecture & file responsibilities
├── ROLLBACK.md         ← How to roll back any deployment
├── vercel.json         ← Routing: /api/* → api/, /* → Energy V1/
├── package.json        ← Node 18+, ESM, dependencies
└── .gitignore
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS (ES6+) |
| Styling | Custom CSS + Tailwind CDN (legacy), Google Fonts |
| Animations | AOS 2.3.1, CSS transitions |
| Icons | Font Awesome 6.4.0 |
| PDF | jsPDF (client-side invoice generation) |
| Backend | Node.js 18 (Vercel Serverless Functions) |
| Database | Supabase (Postgres, `orders` table) |
| Email | Resend API (transactional, with PDF attachment) |
| Notifications | WhatsApp Cloud API (Graph API v18.0) |
| Hosting | Vercel |

---

## Design System

Matches [roam-electric.com](https://www.roam-electric.com/) visual identity:

| Token | Value |
|-------|-------|
| Primary blue | `#146EF5` |
| Dark background | `#0a0a0a` |
| Nav background | `#111111` |
| Body text | `#1a1a1a` |
| Muted text | `#6b7280` |
| White | `#ffffff` |
| Light surface | `#f8f8f8` |
| Font — headings | Montserrat (700, 800) |
| Font — body | Plus Jakarta Sans (400, 500, 600) |
| Border radius | 8px (cards), 4px (buttons) |

---

## API Reference

### `POST /api/checkout`

| Item | Detail |
|------|--------|
| Auth | `x-api-key: <API_ACCESS_TOKEN>` header |
| Rate limit | 30 req / 60s per IP |
| CORS | `ALLOWED_ORIGINS` env var |

**Request body:**
```json
{
  "user": { "name": "", "email": "", "phone": "" },
  "cart": [{ "id": "", "qty": 1, "price": 0 }],
  "pdfBase64": "data:application/pdf;base64,...",
  "orderReference": "ORD-YYYYMMDD-XXX",
  "currency": "KES",
  "totalAmount": 0,
  "filename": "quote.pdf"
}
```

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) | ✅ |
| `SUPABASE_ORDERS_TABLE` | Table name | default: `orders` |
| `RESEND_API_KEY` | Email API key | ✅ |
| `RESEND_FROM_EMAIL` | Verified sender | ✅ |
| `WHATSAPP_API_TOKEN` | Graph API token | ✅ |
| `WHATSAPP_PHONE_NUMBER_ID` | Sender phone ID | ✅ |
| `WHATSAPP_RECIPIENT` | Order recipient | default: `+254704612435` |
| `API_ACCESS_TOKEN` | Shared API secret | ✅ |
| `ALLOWED_ORIGINS` | CORS allowlist | optional |

---

## Products Catalog

| Product | SKU | Price (KES) |
|---------|-----|-------------|
| Jinko Bifacial 585W | `jinko-585w` | 32,500 |
| Jinko Bifacial 620W | `jinko-620w` | 38,500 |
| Deye 5kW Hybrid | `deye-5kw-single` | 95,000 |
| Deye 8kW Hybrid | `deye-8kw-single` | 140,000 |
| Deye 10kW 3-phase | `deye-10kw-three` | 185,000 |
| Dyness 5.12kWh | `dyness-5kwh` | 120,000 |
| Dyness 10.24kWh | `dyness-10kwh` | 215,000 |

---

## Reference Projects

| Project | Location | System | Completed |
|---------|----------|--------|-----------|
| Roam Park | Nairobi | 55.78kWp grid-tied | Aug 2021 |
| Emboo River 2 | Maasai Mara | 64.31kWp off-grid + 153.6kWh | Jan 2023 |
| Sekanani Camp | Maasai Mara | 10.34kWp off-grid + 25.6kWh | Nov 2022 |
| Carton Manufacturers | Nairobi | 403kWp/400kVA rooftop | Mar 2022 |
| Carl Martens | Ukunda, Kwale | 10.45kWp + 15.36kWh | Jun 2023 |

---

## Recent Commits

<!-- RECENT_COMMITS -->

- 47f27f3 fix: remove duplicate const WHATSAPP_NUMBER causing products.js parse crash
- 429c6a4 feat: full site revamp + infrastructure docs
- b91532d feat: add BM25 search engine for UI/UX style guides with design system generation and persistence options
- db34e1f merge: vercel-checkout-backend into main
- 591922e merge: claude/fix-deployment-error into main
- fb53860 Merge pull request #19 from rauell1/codex/update-read-me
- 99cdb03 docs: document WhatsApp recipient env var
- 6fcd2a9 Merge pull request #18 from rauell1/codex/remove-description-from-pdf
- d75ea8f feat: update pdf output and whatsapp target
- 7b18b7d Merge pull request #17 from rauell1/claude/update-pdf-sharing-flow

