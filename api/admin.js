import { createClient } from '@supabase/supabase-js';

const ALLOWED_TABLES = ['products', 'projects'];

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
}

function isAuthorized(req) {
  const key = req.headers['x-api-key'];
  return typeof key === 'string' && key === process.env.API_ACCESS_TOKEN;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getSupabase();

  /* ── GET: list all rows (including inactive) ── */
  if (req.method === 'GET') {
    const { table } = req.query;
    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Invalid table' });
    }
    const { data, error } = await db
      .from(table)
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ data });
  }

  /* ── POST: insert / update / delete ── */
  if (req.method === 'POST') {
    const { table, action, id, data } = req.body || {};
    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Invalid table' });
    }

    let result;
    if (action === 'insert') {
      result = await db.from(table).insert(data).select().single();
    } else if (action === 'update') {
      if (!id) return res.status(400).json({ error: 'id required' });
      result = await db.from(table).update(data).eq('id', id).select().single();
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
