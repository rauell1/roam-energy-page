import { createClient } from '@supabase/supabase-js';
import { getSheetsClient, getHeaders, colToLetter, buildSheetRow } from './sheets.js';

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

// Upsert a single order to the sheet: updates row if found, appends if not
async function syncOrderUpdateToSheet(order) {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    return { ok: false, status: 'no_config', detail: 'Missing GOOGLE_SPREADSHEET_ID' };
  }

  try {
    const sheets  = await getSheetsClient();
    const headers = await getHeaders(sheets, spreadsheetId);

    const orderRefCol = headers.findIndex(h => h.includes('order ref'));
    const statusCol   = headers.findIndex(h => h === 'status');
    const salesCol    = headers.findIndex(h => h.includes('salesperson') || h.includes('sales person'));

    if (orderRefCol === -1) {
      return { ok: false, status: 'col_not_found', detail: `No 'order ref' column. Headers: ${headers.join(', ')}` };
    }

    // Find matching row
    const refColLetter = colToLetter(orderRefCol);
    const refRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Sheet1!${refColLetter}:${refColLetter}`,
    });
    const refValues = refRes.data.values || [];
    const rowIndex  = refValues.findIndex(r => r[0] === order.order_reference);

    if (rowIndex === -1) {
      // Not in sheet — append the full row
      const row = buildSheetRow(headers, order);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:A',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });
      console.log(`[SheetSync] Appended new row for ${order.order_reference}`);
      return { ok: true, status: 'appended', detail: 'Row added to sheet' };
    }

    const rowNum  = rowIndex + 1;
    const updates = [];
    if (statusCol !== -1) {
      const cap = order.status.charAt(0).toUpperCase() + order.status.slice(1);
      updates.push({ range: `Sheet1!${colToLetter(statusCol)}${rowNum}`, values: [[cap]] });
    }
    if (salesCol !== -1) {
      updates.push({ range: `Sheet1!${colToLetter(salesCol)}${rowNum}`, values: [[order.salesperson || '']] });
    }

    if (updates.length) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
      });
    }

    console.log(`[SheetSync] Updated row ${rowNum} for ${order.order_reference}`);
    return { ok: true, status: 'updated', detail: `Row ${rowNum} updated` };

  } catch (err) {
    console.error('[SheetSync] Error:', err.message);
    return { ok: false, status: 'api_error', detail: err.message };
  }
}

// Full sync: push every Supabase order to the sheet (append missing, update existing)
async function syncAllOrdersToSheet(db) {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('Missing GOOGLE_SPREADSHEET_ID');

  const { data: orders, error } = await db
    .from('orders')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);

  const sheets  = await getSheetsClient();
  const headers = await getHeaders(sheets, spreadsheetId);

  const orderRefCol = headers.findIndex(h => h.includes('order ref'));
  const statusCol   = headers.findIndex(h => h === 'status');
  const salesCol    = headers.findIndex(h => h.includes('salesperson') || h.includes('sales person'));

  if (orderRefCol === -1) throw new Error(`No 'order ref' column found. Headers: ${headers.join(', ')}`);

  // Read all existing sheet data (skip header row)
  const dataRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `Sheet1!${colToLetter(orderRefCol)}2:${colToLetter(orderRefCol)}`,
  });
  const refRows = dataRes.data.values || [];

  // Build map: orderReference → 1-indexed row number in sheet
  const sheetMap = {};
  refRows.forEach((r, i) => { if (r[0]) sheetMap[r[0]] = i + 2; });

  const toAppend  = [];
  const toUpdate  = []; // { range, values }[]

  for (const order of orders) {
    const ref = order.order_reference;
    if (!sheetMap[ref]) {
      toAppend.push(buildSheetRow(headers, order));
    } else {
      const rowNum = sheetMap[ref];
      const cap    = order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Draft';
      if (statusCol !== -1) {
        toUpdate.push({ range: `Sheet1!${colToLetter(statusCol)}${rowNum}`, values: [[cap]] });
      }
      if (salesCol !== -1) {
        toUpdate.push({ range: `Sheet1!${colToLetter(salesCol)}${rowNum}`, values: [[order.salesperson || '']] });
      }
    }
  }

  // Batch append missing orders
  if (toAppend.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:A',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: toAppend },
    });
  }

  // Batch update existing rows (chunk to avoid oversized requests)
  const CHUNK = 200;
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: 'USER_ENTERED', data: toUpdate.slice(i, i + CHUNK) },
    });
  }

  console.log(`[SyncAll] appended=${toAppend.length} updated=${toUpdate.length / 2 || toUpdate.length} total=${orders.length}`);
  return { appended: toAppend.length, updated: Math.ceil(toUpdate.length / 2), total: orders.length };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = await getAuthorizedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

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

  /* ── POST: insert / update / delete / sync_sheet ── */
  if (req.method === 'POST') {
    const { table, action, id, data } = req.body || {};

    // sync_sheet is a special action that doesn't need table validation
    if (action === 'sync_sheet') {
      try {
        const result = await syncAllOrdersToSheet(db);
        return res.status(200).json(result);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Invalid table' });
    }
    if (table === 'orders' && action !== 'update') {
      return res.status(400).json({ error: 'Orders can only be updated from admin' });
    }

    let result;
    if (action === 'insert') {
      result = await db.from(table).insert(data).select().single();
    } else if (action === 'update') {
      if (!id) return res.status(400).json({ error: 'id required' });
      result = await db.from(table).update(data).eq('id', id).select().single();
      if (table === 'orders' && !result.error && result.data) {
        const sheetSync = await syncOrderUpdateToSheet(result.data);
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
