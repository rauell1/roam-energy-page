import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { appConfig, validateEnvironment } from './config.js';

let supabase;
const resend = new Resend(appConfig.email.apiKey);
const rateLimitStore = new Map();

function getSupabase() {
  if (!supabase) {
    supabase = createClient(appConfig.supabase.url, appConfig.supabase.serviceKey);
  }
  return supabase;
}

function setCors(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
}

function getRequestIdentity(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(identity) {
  const now = Date.now();
  const entry = rateLimitStore.get(identity);
  if (entry && entry.resetAt > now && entry.count >= appConfig.rateLimit.maxRequests) return true;
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(identity, { count: 1, resetAt: now + appConfig.rateLimit.windowMs });
    return false;
  }
  rateLimitStore.set(identity, { count: entry.count + 1, resetAt: entry.resetAt });
  return false;
}

function validateApiKey(req) {
  const provided = req.headers['x-api-key'];
  return typeof provided === 'string' && provided === appConfig.security.apiAccessToken;
}

function normalizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function validateOrderPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { errors: ['Request body must be a JSON object'], order: null };
  }

  const customer = payload.user || {};
  const cart = Array.isArray(payload.cart) ? payload.cart : [];
  const pdfBase64 = normalizeString(payload.pdfBase64 || payload.pdf);
  const orderReference = normalizeString(payload.orderReference);
  const currency = normalizeString(payload.currency || 'KES');
  const filename = normalizeString(payload.filename || 'order.pdf');
  const totalAmount = Number.parseFloat(payload.totalAmount);

  if (!customer.name || !customer.email || !customer.phone) {
    errors.push('Missing customer details (name, email, phone).');
  }
  if (!cart.length) errors.push('Cart is empty.');
  if (!pdfBase64.startsWith('data:application/pdf;base64,')) {
    errors.push('PDF content must be a base64 data URL.');
  }
  if (!orderReference) errors.push('Order reference is required.');
  if (Number.isNaN(totalAmount) || totalAmount <= 0) {
    errors.push('Total amount must be a positive number.');
  }

  if (errors.length) return { errors, order: null };

  return {
    errors: [],
    order: {
      customer: {
        name: normalizeString(customer.name),
        email: normalizeString(customer.email),
        phone: normalizeString(customer.phone),
      },
      cart,
      orderReference,
      currency,
      filename,
      pdfBase64,
      totalAmount,
    },
  };
}

async function storeOrder(order) {
  const db = getSupabase();
  const { data, error } = await db.from(appConfig.supabase.ordersTable).insert({
    order_reference: order.orderReference,
    customer_name: order.customer.name,
    customer_email: order.customer.email,
    customer_phone: order.customer.phone,
    cart: order.cart,
    currency: order.currency,
    total_amount: order.totalAmount,
    filename: order.filename,
    status: 'pending',
  }).select('id').single();
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return data.id;
}

async function markOrderDelivery(orderId, fields) {
  const db = getSupabase();
  await db.from(appConfig.supabase.ordersTable).update(fields).eq('id', orderId);
}

function buildEmailHtml(order) {
  const lineItems = order.cart
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">${item.name || item.id}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;text-align:center;">${item.qty}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;text-align:right;">${order.currency} ${(item.price * item.qty).toLocaleString()}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;">Roam <span style="color:#146EF5;">Energy</span></span>
                </td>
                <td align="right">
                  <span style="font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:0.05em;text-transform:uppercase;">Pro Forma Invoice</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 0;">
            <p style="margin:0 0 8px;font-size:15px;color:#6b7280;">Hi ${order.customer.name},</p>
            <h1 style="margin:0 0 20px;font-size:24px;font-weight:800;color:#0a0a0a;letter-spacing:-0.02em;">Your quotation is ready</h1>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
              Thank you for your interest in Roam Energy solar solutions. Your Pro Forma invoice is attached to this email. Our team will contact you on <strong style="color:#374151;">${order.customer.phone}</strong> to confirm the next steps.
            </p>

            <!-- Order ref pill -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 18px;">
                  <span style="font-size:12px;font-weight:700;color:#146EF5;letter-spacing:0.06em;text-transform:uppercase;">Reference</span>
                  <span style="display:block;font-size:16px;font-weight:700;color:#0a0a0a;margin-top:2px;">${order.orderReference}</span>
                </td>
              </tr>
            </table>

            <!-- Line items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;text-align:left;">Product</th>
                  <th style="padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;text-align:center;">Qty</th>
                  <th style="padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>${lineItems}</tbody>
            </table>

            <!-- Total -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
              <tr>
                <td align="right">
                  <span style="font-size:13px;color:#6b7280;">Total (excl. installation &amp; VAT)</span><br>
                  <span style="font-size:26px;font-weight:800;color:#0a0a0a;letter-spacing:-0.02em;">${order.currency} ${order.totalAmount.toLocaleString()}</span>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
              <tr>
                <td style="background:#146EF5;border-radius:6px;">
                  <a href="https://roam-energy.vercel.app/" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Visit Roam Energy</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Roam Energy · energy@roam-electric.com · +254 704 612 435</p>
            <p style="margin:0;font-size:12px;color:#9ca3af;">This quotation is valid for 30 days. Prices are in ${order.currency} and exclude VAT.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendOrderEmail(order) {
  const attachmentContent = order.pdfBase64.replace('data:application/pdf;base64,', '');

  await resend.emails.send({
    from: appConfig.email.fromAddress,
    to: order.customer.email,
    replyTo: 'energy@roam-electric.com',
    subject: `Your Roam Energy quotation — ${order.orderReference}`,
    html: buildEmailHtml(order),
    attachments: [
      { content: attachmentContent, filename: order.filename, type: 'application/pdf' },
    ],
  });
}

function isOriginAllowed(origin) {
  if (!origin) return !appConfig.cors.allowedOrigins.length;
  if (!appConfig.cors.allowedOrigins.length) return true;
  return appConfig.cors.allowedOrigins.includes(origin);
}

export default async function handler(req, res) {
  try {
    validateEnvironment();
  } catch (error) {
    return res.status(500).json({ message: 'Server misconfiguration', detail: error.message });
  }

  const origin = req.headers.origin;
  if (req.method === 'OPTIONS') {
    setCors(res, origin);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  if (!isOriginAllowed(origin)) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  setCors(res, origin);

  if (!validateApiKey(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const requester = getRequestIdentity(req);
  if (isRateLimited(requester)) {
    return res.status(429).json({ message: 'Too many requests, please retry later.' });
  }

  const { errors, order } = validateOrderPayload(req.body);
  if (errors.length) {
    return res.status(400).json({ message: 'Invalid order payload', errors });
  }

  let orderId;
  try {
    orderId = await storeOrder(order);
  } catch (error) {
    console.error('Supabase insert failed', error);
    return res.status(502).json({
      message: 'Failed to save order. Please try again or contact support.',
      detail: error.message,
    });
  }

  try {
    await sendOrderEmail(order);
    await markOrderDelivery(orderId, { email_sent: true, status: 'confirmed' });
  } catch (error) {
    console.error('Email send failed (order already saved)', error);
    await markOrderDelivery(orderId, { status: 'delivery_failed' });
  }

  return res.status(200).json({ message: 'Order processed successfully' });
}
