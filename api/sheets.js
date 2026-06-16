import { google } from 'googleapis';

export function colToLetter(index) {
  let letter = '';
  let n = index + 1;
  while (n > 0) {
    const mod = (n - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

export async function getSheetsClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set');
  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export async function getHeaders(sheets, spreadsheetId) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!1:1',
  });
  return (res.data.values?.[0] || []).map(h => h.toLowerCase().trim());
}

// Map a Supabase order row to a sheet row array (aligned to headers)
export function buildSheetRow(headers, order) {
  const cart = Array.isArray(order.cart) ? order.cart : [];
  const itemsStr = cart.map(i => `${i.name || i.id} (Qty: ${i.qty})`).join(', ');
  const status = order.status
    ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
    : 'Draft';

  const fieldMap = {
    'order reference': order.order_reference,
    'order ref':       order.order_reference,
    'customer name':   order.customer_name,
    'name':            order.customer_name,
    'email':           order.customer_email,
    'phone':           order.customer_phone,
    'total':           order.total_amount,
    'amount':          order.total_amount,
    'currency':        order.currency,
    'items':           itemsStr,
    'pdf':             order.pdf_url ? `=HYPERLINK("${order.pdf_url}","View PDF")` : '',
    'link':            order.pdf_url ? `=HYPERLINK("${order.pdf_url}","View PDF")` : '',
    'date':            order.created_at || '',
    'timestamp':       order.created_at || '',
    'status':          status,
    'salesperson':     order.salesperson || '',
    'expiry':          order.expiry_date || '',
    'source':          order.source || '',
  };

  return headers.map(h => {
    for (const [key, val] of Object.entries(fieldMap)) {
      if (h.includes(key)) return val ?? '';
    }
    return '';
  });
}
