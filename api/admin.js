import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

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

function colToLetter(index) {
  let letter = '';
  let n = index + 1;
  while (n > 0) {
    const mod = (n - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

async function syncOrderUpdateToSheet(order) {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!serviceAccountJson || !spreadsheetId) {
    console.error('[SheetSync] Missing GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SPREADSHEET_ID');
    return { ok: false, status: 'no_config', detail: 'Missing Sheets env vars' };
  }

  let credentials;
  try {
    credentials = JSON.parse(serviceAccountJson);
  } catch (e) {
    console.error('[SheetSync] Failed to parse service account JSON:', e.message);
    return { ok: false, status: 'invalid_credentials', detail: e.message };
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Read header row to locate columns dynamically
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!1:1',
    });
    const headers = (headerRes.data.values?.[0] || []).map(h => h.toLowerCase().trim());

    const orderRefCol = headers.findIndex(h => h.includes('order ref'));
    const statusCol   = headers.findIndex(h => h === 'status');
    const salesCol    = headers.findIndex(h => h.includes('salesperson') || h.includes('sales person'));

    if (orderRefCol === -1) {
      return { ok: false, status: 'col_not_found', detail: `No 'order ref' column in: ${headers.join(', ')}` };
    }

    // Find the row matching this order reference
    const refColLetter = colToLetter(orderRefCol);
    const refRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Sheet1!${refColLetter}:${refColLetter}`,
    });
    const refValues = refRes.data.values || [];
    const rowIndex = refValues.findIndex(r => r[0] === order.order_reference);

    if (rowIndex === -1) {
      return { ok: false, status: 'row_not_found', detail: `${order.order_reference} not in sheet` };
    }
    const rowNum = rowIndex + 1;

    // Build batch update for Status and Salesperson
    const updates = [];
    if (statusCol !== -1) {
      const capitalized = order.status.charAt(0).toUpperCase() + order.status.slice(1);
      updates.push({ range: `Sheet1!${colToLetter(statusCol)}${rowNum}`, values: [[capitalized]] });
    }
    if (salesCol !== -1) {
      updates.push({ range: `Sheet1!${colToLetter(salesCol)}${rowNum}`, values: [[order.salesperson || '']] });
    }

    if (!updates.length) {
      return { ok: false, status: 'nothing_to_update', detail: 'Status/Salesperson columns not found' };
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
    });

    console.log(`[SheetSync] Updated row ${rowNum} for ${order.order_reference}`);
    return { ok: true, status: 'updated', detail: `Row ${rowNum} updated` };

  } catch (err) {
    console.error('[SheetSync] Error:', err.message);
    return { ok: false, status: 'api_error', detail: err.message };
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
        const sheetSync = await syncOrderUpdateToSheet(result.data);
        if (result.error) return res.status(500).json({ error: result.error.message });
        return res.status(200).json({ data: result.data ?? null, sheetSync });
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
