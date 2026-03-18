import { createClient } from '@supabase/supabase-js';
import Resend from 'resend';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend({ apiKey: resendApiKey });

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method not allowed' });
  }

  const { user, cart, orderReference, filename, pdfBase64, currency, totalAmount } = req.body;
  
  // Insert order into Supabase
  const { data, error } = await supabase
    .from('orders')
    .insert([{ user, cart, orderReference, filename, pdfBase64, currency, totalAmount }]);

  if (error) {
    return res.status(400).send({ success: false, error });
  }

  // Send email via Resend
  const email = await resend.sendEmail({
    to: process.env.ORDER_INBOX_EMAIL,
    subject: `New Order: ${orderReference}`,
    html: `<h1>Order Details</h1><p>${JSON.stringify(data)}</p>`,
    attachments: [{ filename, content: pdfBase64, type: 'application/pdf' }],
  });

  if (!email) {
    return res.status(500).send({ success: false, fallback: true, waLink: `https://wa.me/${process.env.SALES_WHATSAPP_NUMBER}` });
  }
  
  return res.status(200).send({ success: true });
}