import { createClient } from '@supabase/supabase-js';

// Called by Google Apps Script onEdit trigger when Status or Salesperson
// columns are edited directly in the Google Sheet. Uses a shared secret
// (ORDERS_SYNC_SECRET env var) so no admin JWT is required from the Script.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { syncSecret, orderReference, status, salesperson } = req.body || {};

  const secret = process.env.ORDERS_SYNC_SECRET;
  if (!secret || syncSecret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!orderReference) return res.status(400).json({ error: 'orderReference required' });

  const updateData = {};
  // Lowercase status so Supabase always stores lowercase (admin panel uses lowercase)
  if (status      !== undefined) updateData.status      = status.toLowerCase();
  if (salesperson !== undefined) updateData.salesperson = salesperson;

  if (!Object.keys(updateData).length) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await db
    .from('orders')
    .update(updateData)
    .eq('order_reference', orderReference);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ status: 'synced' });
}
