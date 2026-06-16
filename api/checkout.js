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

  const source = normalizeString(payload.source || 'web') || 'web';
  const queuedAt = payload.queuedAt ? new Date(payload.queuedAt).toISOString() : null;

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
      source,
      queuedAt,
    },
  };
}

async function storeOrder(order, pdfUrl) {
  const db = getSupabase();
  const expiryDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data, error } = await db.from(appConfig.supabase.ordersTable).insert({
    order_reference: order.orderReference,
    customer_name:   order.customer.name,
    customer_email:  order.customer.email,
    customer_phone:  order.customer.phone,
    cart:            order.cart,
    currency:        order.currency,
    total_amount:    order.totalAmount,
    filename:        order.filename,
    status:          'draft',
    pdf_url:         pdfUrl,
    source:          order.source || 'web',
    queued_at:       order.queuedAt || null,
    salesperson:     '',
    expiry_date:     expiryDate,
  }).select('id').single();
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return data.id;
}

async function uploadInvoicePdf(filename, pdfBase64) {
  const db = getSupabase();
  const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const { data, error } = await db.storage
    .from('quotations')
    .upload(filename, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    console.error('Storage upload failed:', error);
    return null;
  }

  const { data: { publicUrl } } = db.storage
    .from('quotations')
    .getPublicUrl(filename);

  return publicUrl;
}

async function markOrderDelivery(orderId, fields) {
  const db = getSupabase();
  await db.from(appConfig.supabase.ordersTable).update(fields).eq('id', orderId);
}

function buildEmailHtml(order, pdfUrl) {
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
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 18px;">
                  <span style="font-size:12px;font-weight:700;color:#146EF5;letter-spacing:0.06em;text-transform:uppercase;">Reference</span>
                  <span style="display:block;font-size:16px;font-weight:700;color:#0a0a0a;margin-top:2px;">${order.orderReference}</span>
                </td>
              </tr>
            </table>

            <!-- Customer Details for Follow Up -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border:1px solid #e5e7eb;border-radius:8px;padding:16px;background:#f9fafb;">
              <tr>
                <td style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">Customer Details</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#4b5563;padding-top:10px;line-height:1.6;">
                  <span style="color:#6b7280;">Name:</span> <strong style="color:#111827;">${order.customer.name}</strong><br>
                  <span style="color:#6b7280;">Phone:</span> <strong style="color:#111827;">${order.customer.phone}</strong><br>
                  <span style="color:#6b7280;">Email:</span> <strong style="color:#111827;">${order.customer.email}</strong>
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
                <td style="background:#146EF5;border-radius:6px;padding:14px 28px;">
                  <a href="https://roam-energy.rauell.systems/" style="display:inline-block;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Visit Roam Energy</a>
                </td>
                ${pdfUrl ? `
                <td style="padding-left:16px;">
                  <a href="${pdfUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#146EF5;text-decoration:none;border:2px solid #146EF5;border-radius:6px;">View PDF Quotation</a>
                </td>
                ` : ''}
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

function buildAdminEmailHtml(order, pdfUrl) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' });
  const isOfflineSync = order.source === 'web-offline-sync';

  const lineItems = order.cart.map((item) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #334155;font-size:13px;color:#e2e8f0;">${item.name || item.id}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #334155;font-size:13px;color:#94a3b8;text-align:center;">${item.qty}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #334155;font-size:13px;color:#94a3b8;text-align:right;">${order.currency} ${(item.price || 0).toLocaleString()}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #334155;font-size:13px;font-weight:700;color:#f8fafc;text-align:right;">${order.currency} ${((item.price || 0) * item.qty).toLocaleString()}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;max-width:620px;width:100%;border:1px solid #334155;">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="background:#ef4444;color:#fff;font-size:10px;font-weight:800;letter-spacing:0.12em;padding:4px 10px;border-radius:4px;text-transform:uppercase;">NEW ORDER</span>
                  ${isOfflineSync ? '<span style="background:#f59e0b;color:#000;font-size:10px;font-weight:800;letter-spacing:0.10em;padding:4px 10px;border-radius:4px;text-transform:uppercase;margin-left:8px;">OFFLINE SYNC</span>' : ''}
                  <span style="display:block;font-size:20px;font-weight:800;color:#f8fafc;margin-top:10px;letter-spacing:-0.02em;">Roam <span style="color:#146EF5;">Energy</span> · Admin Notification</span>
                </td>
                <td align="right" style="white-space:nowrap;">
                  <span style="font-size:12px;color:#64748b;">${dateStr}</span><br>
                  <span style="font-size:12px;color:#64748b;">${timeStr} EAT</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Summary bar -->
        <tr>
          <td style="background:#162032;border-top:1px solid #334155;border-bottom:1px solid #334155;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px 32px;border-right:1px solid #334155;">
                  <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Reference</span>
                  <span style="display:block;font-size:15px;font-weight:800;color:#f8fafc;margin-top:4px;font-family:monospace;">${order.orderReference}</span>
                </td>
                <td style="padding:16px 32px;border-right:1px solid #334155;">
                  <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Total</span>
                  <span style="display:block;font-size:15px;font-weight:800;color:#22c55e;margin-top:4px;">${order.currency} ${order.totalAmount.toLocaleString()}</span>
                </td>
                <td style="padding:16px 32px;">
                  <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Source</span>
                  <span style="display:block;font-size:15px;font-weight:800;color:#f8fafc;margin-top:4px;">${order.source || 'web'}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Customer info -->
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Customer Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;border:1px solid #334155;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:80px;">Name</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:700;color:#f8fafc;">${order.customer.name}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Phone</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:700;color:#f8fafc;">
                        <a href="tel:${order.customer.phone}" style="color:#22c55e;text-decoration:none;">${order.customer.phone}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Email</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:700;color:#f8fafc;">
                        <a href="mailto:${order.customer.email}" style="color:#146EF5;text-decoration:none;">${order.customer.email}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Line items -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Order Items</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #334155;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#0f172a;">
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">Product</th>
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;text-align:center;">Qty</th>
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">Unit Price</th>
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">Line Total</th>
                </tr>
              </thead>
              <tbody>${lineItems}</tbody>
            </table>
          </td>
        </tr>

        <!-- Total -->
        <tr>
          <td style="padding:20px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;border:1px solid #334155;padding:0;">
              <tr>
                <td style="padding:16px 24px;" align="right">
                  <span style="font-size:12px;color:#64748b;">Grand Total (excl. VAT &amp; installation)</span><br>
                  <span style="font-size:28px;font-weight:800;color:#22c55e;letter-spacing:-0.02em;">${order.currency} ${order.totalAmount.toLocaleString()}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Actions -->
        <tr>
          <td style="padding:24px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                ${pdfUrl ? `
                <td style="padding-right:12px;">
                  <a href="${pdfUrl}" style="display:inline-block;background:#146EF5;color:#fff;font-size:13px;font-weight:700;padding:12px 22px;border-radius:6px;text-decoration:none;">View PDF Quotation</a>
                </td>` : ''}
                <td>
                  <a href="mailto:${order.customer.email}?subject=Re: Quotation ${order.orderReference}" style="display:inline-block;border:1px solid #334155;color:#94a3b8;font-size:13px;font-weight:700;padding:12px 22px;border-radius:6px;text-decoration:none;">Reply to Customer</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;border-top:1px solid #334155;padding:16px 32px;">
            <p style="margin:0;font-size:11px;color:#475569;">Roam Energy admin notification · This email is sent only to authorised recipients · <a href="https://roam-energy.rauell.systems/" style="color:#475569;">roam-energy.rauell.systems</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendOrderEmail(order, pdfUrl) {
  const attachmentContent = order.pdfBase64.replace('data:application/pdf;base64,', '');
  const attachment = { content: attachmentContent, filename: order.filename, type: 'application/pdf' };

  // 1. Customer-facing email (friendly quote receipt)
  await resend.emails.send({
    from:    appConfig.email.fromAddress,
    to:      order.customer.email,
    replyTo: 'energy@roam-electric.com',
    subject: `Your Roam Energy quotation — ${order.orderReference}`,
    html:    buildEmailHtml(order, pdfUrl),
    attachments: [attachment],
  });

  // 2. Admin notification (dedicated, not BCC) — explicit tracking for Roy
  await resend.emails.send({
    from:    appConfig.email.fromAddress,
    to:      'roy.otieno@roam-electric.com',
    replyTo: order.customer.email,
    subject: `[NEW ORDER] ${order.orderReference} — ${order.customer.name} — ${order.currency} ${Number(order.totalAmount).toLocaleString()}`,
    html:    buildAdminEmailHtml(order, pdfUrl),
    attachments: [attachment],
  });
}

async function triggerGoogleSheetsWebhook(order, pdfUrl) {
  const webhookUrl = appConfig.webhooks.googleSheetsUrl;
  if (!webhookUrl) {
    console.warn('Google Sheets Webhook URL is not configured, skipping fallback sheet logging.');
    return;
  }

  const payload = {
    orderReference: order.orderReference,
    customerName:   order.customer.name,
    customerEmail:  order.customer.email,
    customerPhone:  order.customer.phone,
    totalAmount:    order.totalAmount,
    currency:       order.currency,
    items:          order.cart.map(item => `${item.name || item.id} (Qty: ${item.qty})`).join(', '),
    pdfUrl:         pdfUrl || '',
    timestamp:      new Date().toISOString(),
    status:         'Draft',
    salesperson:    '',
  };

  const body = JSON.stringify(payload);
  const headers = { 'Content-Type': 'application/json' };

  try {
    // Google Apps Script /exec endpoints return a 302 redirect on POST requests.
    // Node fetch follows the redirect but converts POST→GET, so doPost() never fires.
    // Fix: catch the redirect manually and re-issue the POST to the final URL.
    let res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
      redirect: 'manual',
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (location) {
        res = await fetch(location, { method: 'POST', headers, body });
      }
    }

    if (!res.ok) {
      console.error('Google Sheets Webhook failed:', res.status, res.statusText);
    } else {
      console.log('Google Sheets Webhook successfully triggered.');
    }
  } catch (err) {
    console.error('Error triggering Google Sheets Webhook:', err.message);
  }
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

  let pdfUrl = null;
  let uploadError = null;
  try {
    const db = getSupabase();
    const base64Data = order.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const { data, error } = await db.storage
      .from('quotations')
      .upload(order.filename, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      uploadError = error;
      console.error('Storage upload failed:', error);
    } else {
      const { data: { publicUrl } } = db.storage
        .from('quotations')
        .getPublicUrl(order.filename);
      pdfUrl = publicUrl;
    }
  } catch (storageError) {
    uploadError = storageError.message || storageError;
    console.error('Supabase storage upload failed:', storageError);
  }

  let orderId;
  try {
    orderId = await storeOrder(order, pdfUrl);
  } catch (error) {
    console.error('Supabase insert failed', error);
    return res.status(502).json({
      message: 'Failed to save order. Please try again or contact support.',
      detail: error.message,
    });
  }

  try {
    await sendOrderEmail(order, pdfUrl);
    await markOrderDelivery(orderId, { email_sent: true, admin_notified: true, status: 'confirmed' });
  } catch (error) {
    console.error('Email send failed (order already saved in Supabase)', error);
    await markOrderDelivery(orderId, { status: 'delivery_failed' });
  }

  // Trigger Google Sheets Webhook Fallback
  await triggerGoogleSheetsWebhook(order, pdfUrl);

  return res.status(200).json({
    message: 'Order processed successfully',
    pdfUrl,
  });
}
