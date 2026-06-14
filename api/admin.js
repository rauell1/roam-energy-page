import { createClient } from '@supabase/supabase-js';

const ALLOWED_TABLES = ['products', 'projects'];

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

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = await getAuthorizedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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
