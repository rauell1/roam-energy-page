import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';
import { Resend } from 'resend';
import { appConfig, validateEnvironment } from './config.js';

const client = new MongoClient(appConfig.mongodb.uri);
const resend = new Resend(appConfig.email.apiKey);
let mongoClientPromise;
const rateLimitStore = new Map();

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
  if (entry && entry.resetAt > now && entry.count >= appConfig.rateLimit.maxRequests) {
    return true;
  }

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

  if (!cart.length) {
    errors.push('Cart is empty.');
  }

  if (!pdfBase64.startsWith('data:application/pdf;base64,')) {
    errors.push('PDF content must be a base64 data URL.');
  }

  if (!orderReference) {
    errors.push('Order reference is required.');
  }

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

async function getDatabase() {
  if (!mongoClientPromise) {
    mongoClientPromise = client.connect();
  }
  const connected = await mongoClientPromise;
  return connected.db(appConfig.mongodb.dbName);
}

async function storeOrder(order) {
  const db = await getDatabase();
  const orders = db.collection(appConfig.mongodb.ordersCollection);
  await orders.insertOne({
    ...order,
    createdAt: new Date(),
  });
}

async function sendOrderEmail(order) {
  const attachmentContent = order.pdfBase64.replace('data:application/pdf;base64,', '');
  const html = `
    <p>Hi ${order.customer.name},</p>
    <p>We received your order <strong>${order.orderReference}</strong> totaling ${order.currency} ${order.totalAmount}.</p>
    <p>We'll reach out on ${order.customer.phone} to confirm delivery details.</p>
  `;

  await resend.emails.send({
    from: appConfig.email.fromAddress,
    to: order.customer.email,
    subject: `Order confirmation ${order.orderReference}`,
    html,
    attachments: [
      { content: attachmentContent, filename: order.filename, type: 'application/pdf' },
    ],
  });
}

async function sendWhatsAppConfirmation(order) {
  // Step 1: Upload the PDF to WhatsApp media endpoint
  const pdfBuffer = Buffer.from(order.pdfBase64.replace('data:application/pdf;base64,', ''), 'base64');

  const uploadUrl = `https://graph.facebook.com/${appConfig.whatsapp.apiVersion}/${appConfig.whatsapp.phoneNumberId}/media`;
  const FormData = (await import('form-data')).default;
  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('file', pdfBuffer, {
    filename: order.filename,
    contentType: 'application/pdf',
  });

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appConfig.whatsapp.apiToken}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`WhatsApp media upload failed: ${uploadResponse.status} ${text}`);
  }

  const uploadResult = await uploadResponse.json();
  const mediaId = uploadResult.id;

  // Step 2: Send the document message with the uploaded media
  const recipient = appConfig.whatsapp.recipientNumber;
  if (!recipient) {
    throw new Error('WhatsApp recipient number is not configured.');
  }

  const messageUrl = `https://graph.facebook.com/${appConfig.whatsapp.apiVersion}/${appConfig.whatsapp.phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'document',
    document: {
      id: mediaId,
      filename: order.filename,
      caption: `Thanks ${order.customer.name}, we received order ${order.orderReference}. Total: ${order.currency} ${order.totalAmount}.`,
    },
  };

  const response = await fetch(messageUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appConfig.whatsapp.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WhatsApp delivery failed: ${response.status} ${text}`);
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

  try {
    await storeOrder(order);
    await sendOrderEmail(order);
    await sendWhatsAppConfirmation(order);
    return res.status(200).json({ message: 'Order processed successfully' });
  } catch (error) {
    console.error('checkout handler failed', error);
    return res.status(502).json({
      message: 'Failed to process order. Please try again or contact support.',
      detail: error.message,
    });
  }
}
