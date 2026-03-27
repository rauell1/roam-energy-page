# Roam Energy

Marketing site and checkout API for Roam Energy (solar solutions).

- Live (Vercel): https://roam-energy.vercel.app/
- Tech: Static HTML/CSS/vanilla JS (frontend), Vercel/Next API route (Node 18), MongoDB, Resend, WhatsApp Cloud API.

## Features

- Product catalogue with PDF export and email handoff
- Project showcase with modal gallery
- Sticky WhatsApp CTA with scroll-aware visibility
- Checkout API saves orders, emails confirmation, and sends WhatsApp follow-up

## Repository layout

```
Energy V1/        # Static site assets (HTML/CSS/JS/images)
api/checkout.js   # Order processing API (Vercel/Next API route)
api/config.js     # Environment + runtime configuration
```

## Setup

1. Install Node 18+ and MongoDB (or use Atlas).
2. Configure the environment variables below.
3. Install API dependencies:
   ```bash
   npm install
   ```
4. Serve the static site:
   ```bash
   npx serve "Energy V1"
   ```
5. Deploy `api/` with Vercel (recommended) or run locally via `vercel dev` / `next dev` if using a Next.js wrapper.

## Environment variables

| Name | Description |
| --- | --- |
| MONGODB_URI | MongoDB connection string (with credentials). |
| MONGODB_DB_NAME | Database name (default `roam-energy`). |
| MONGODB_ORDERS_COLLECTION | Collection for orders (default `orders`). |
| RESEND_API_KEY | Resend API key for transactional email. |
| RESEND_FROM_EMAIL | Verified sender email for Resend. |
| WHATSAPP_API_TOKEN | WhatsApp Cloud API token. |
| WHATSAPP_PHONE_NUMBER_ID | WhatsApp sender phone number ID. |
| WHATSAPP_API_VERSION | WhatsApp Graph API version (default `v18.0`). |
| WHATSAPP_RECIPIENT | WhatsApp number to receive order PDFs (digits only; defaults to `+254704612435`). |
| API_ACCESS_TOKEN | Shared secret required in `x-api-key` for order requests. |
| ALLOWED_ORIGINS | Comma-separated origins allowed to call the API. |
| RATE_LIMIT_WINDOW_MS | Rate limit window in ms (default `60000`). |
| RATE_LIMIT_MAX_REQUESTS | Requests allowed per window (default `30`). |

## Running tests / lint

No automated tests or linters are defined in this repo. Add a pipeline (for example, eslint + unit tests) before production rollout.

## Deployment (Vercel)

1. Set the environment variables above in the Vercel project.
2. Framework preset: Other / static.
3. Root directory: `Energy V1` for the static site; API routes deploy from `api/`.
4. Enable a custom domain and enforce HTTPS.
5. The included `vercel.json` rewrites static assets from `Energy V1` and pins the API runtime to Node 18.

## Proposed feature-based structure (future)

```
app/
  shared/
    components/
    hooks/
    services/
    utils/
    types/
  catalog/
    components/
    services/
    hooks/
  projects/
    components/
    services/
  contact/
    components/
    hooks/
api/
  checkout/
    handler.ts
    validation.ts
    service.ts
    config.ts
```

## Security

- API requires `x-api-key` and origin allow-listing.
- Rate limiting is built in (configurable).
- Inputs validated and sanitized before persistence.
- Email/WhatsApp secrets loaded from environment variables only.

## Maintenance notes

- Pin CDN script versions.
- Rotate API tokens and database credentials regularly.
- Add monitoring/alerting for the checkout endpoint and database connectivity.
