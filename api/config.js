const required = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  apiAccessToken: process.env.API_ACCESS_TOKEN,
};

export function validateEnvironment() {
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const appConfig = {
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ordersTable: process.env.SUPABASE_ORDERS_TABLE || 'orders',
  },
  rateLimit: {
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10),
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
  },
  security: {
    apiAccessToken: process.env.API_ACCESS_TOKEN,
  },
  email: {
    apiKey: process.env.RESEND_API_KEY,
    fromAddress: process.env.RESEND_FROM_EMAIL,
  },
  webhooks: {
    googleSheetsUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '',
  },
};
