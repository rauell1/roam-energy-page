import { createClient } from '@supabase/supabase-js';

const ALLOWED_TABLES = ['products', 'projects', 'subscribers', 'orders', 'salespersons'];
const ALLOWED_ADMIN_EMAIL = 'roy.otieno@roam-electric.com';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function getAuthorizedUser(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  if (user.email !== ALLOWED_ADMIN_EMAIL) return null;
  return user;
}

// Push a status/salesperson change back to the Google Sheet row
async function syncOrderUpdateToSheet(order) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('[SheetSync] GOOGLE_SHEETS_WEBHOOK_URL not set');
    return;
  }

  const payload = {
    action: 'update',
    orderReference: order.order_reference,
    status: order.status,
    salesperson: order.salesperson || '',
  };
  console.log('[SheetSync] Sending:', JSON.stringify(payload));

  const body = JSON.stringify(payload);
  const headers = { 'Content-Type': 'application/json' };

  try {
    let res = await fetch(webhookUrl, { method: 'POST', headers, body, redirect: 'manual' });
    console.log('[SheetSync] Initial response:', res.status);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      console.log('[SheetSync] Redirect to:', location);
      if (location) {
        res = await fetch(location, { method: 'POST', headers, body });
        console.log('[SheetSync] Redirect response:', res.status);
        const text = await res.text();
        console.log('[SheetSync] Redirect body:', text);
      }
    } else {
      const text = await res.text();
      console.log('[SheetSync] Response body:', text);
    }
  } catch (err) {
    console.error('[SheetSync] Error:', err.message);
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = await getAuthorizedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  /* ── GET: list all rows ── */
  if (req.method === 'GET') {
    const { table } = req.query;
    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Invalid table' });
    }
    const isOrders       = table === 'orders';
    const isSubscribers  = table === 'subscribers';
    const isSalespersons = table === 'salespersons';
    const orderCol  = (isOrders || isSubscribers) ? 'created_at' : isSalespersons ? 'name' : 'sort_order';
    const ascending = !isOrders && !isSubscribers;

    const { data, error } = await db
      .from(table)
      .select('*')
      .order(orderCol, { ascending });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ data });
  }

  /* ── POST: insert / update / delete ── */
  if (req.method === 'POST') {
    const { table, action, id, data } = req.body || {};
    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Invalid table' });
    }
    // Orders can only be updated from the admin panel (checkout creates them)
    if (table === 'orders' && action !== 'update') {
      return res.status(400).json({ error: 'Orders can only be updated from admin' });
    }

    let result;
    if (action === 'insert') {
      result = await db.from(table).insert(data).select().single();
    } else if (action === 'update') {
      if (!id) return res.status(400).json({ error: 'id required' });
      result = await db.from(table).update(data).eq('id', id).select().single();
      // Mirror the change to Google Sheets
      if (table === 'orders' && !result.error && result.data) {
        await syncOrderUpdateToSheet(result.data);
      }
    } else if (action === 'delete') {
      if (!id) return res.status(400).json({ error: 'id required' });
      result = await db.from(table).delete().eq('id', id);
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (result.error) return res.status(500).json({ error: result.error.message });
    return res.status(200).json({ data: result.data ?? null });
  }

  res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
  return res.status(405).json({ error: 'Method not allowed' });
}
