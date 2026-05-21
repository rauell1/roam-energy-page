const required = {
  mongodbUri: process.env.MONGODB_URI,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  whatsappApiToken: process.env.WHATSAPP_API_TOKEN,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  apiAccessToken: process.env.API_ACCESS_TOKEN,
};

const defaultWhatsappRecipient = (process.env.WHATSAPP_RECIPIENT || '+254704612435').replace(/\D/g, '');

export function validateEnvironment() {
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const appConfig = {
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME || 'roam-energy',
    ordersCollection: process.env.MONGODB_ORDERS_COLLECTION || 'orders',
  },
  rateLimit: {
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10),
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  },
  security: {
    apiAccessToken: process.env.API_ACCESS_TOKEN,
  },
  email: {
    apiKey: process.env.RESEND_API_KEY,
    fromAddress: process.env.RESEND_FROM_EMAIL,
  },
  whatsapp: {
    apiToken: process.env.WHATSAPP_API_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    recipientNumber: defaultWhatsappRecipient,
  },
};
