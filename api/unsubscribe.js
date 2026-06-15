import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const { email } = req.query || {};

  if (!email) {
    return res.status(400).send(renderResponse(
      false, 
      'Invalid Link', 
      'The unsubscribe link appears to be invalid or incomplete. Please ensure you clicked the full URL.'
    ));
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Perform deletion using the service role client to bypass RLS
    const { error } = await supabase
      .from('subscribers')
      .delete()
      .eq('email', email.trim());

    if (error) throw error;

    return res.status(200).send(renderResponse(
      true, 
      "You're Unsubscribed", 
      `We have successfully removed <strong>${escapeHtml(email)}</strong> from our mailing list. We're sorry to see you go!`
    ));
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return res.status(500).send(renderResponse(
      false, 
      'System Error', 
      `We encountered an error trying to process your request for <strong>${escapeHtml(email)}</strong>. Please email us directly at <a href="mailto:energy@roam-electric.com" style="color:#f47920;">energy@roam-electric.com</a> and we will remove you manually.`
    ));
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderResponse(success, title, message) {
  const icon = success ? '✓' : '✗';
  const iconColor = success ? '#f47920' : '#ef4444';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Roam Energy</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --clr-bg: #0b0c10;
      --clr-card: #1f2833;
      --clr-primary: #f47920;
      --clr-text: #c5c6c7;
      --clr-white: #ffffff;
    }
    body {
      margin: 0; padding: 0;
      background-color: var(--clr-bg);
      color: var(--clr-text);
      font-family: 'Inter', sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; text-align: center;
      box-sizing: border-box; padding: 20px;
    }
    .card {
      background: var(--clr-card);
      border-radius: 16px;
      padding: 40px 30px;
      max-width: 450px; width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.05);
    }
    .logo {
      display: inline-flex;
      align-items: center;
      font-weight: 800;
      font-size: 1.4rem;
      letter-spacing: 0.1em;
      color: var(--clr-white);
      text-decoration: none;
      margin-bottom: 28px;
    }
    .logo span {
      color: var(--clr-primary);
      margin-left: 2px;
    }
    .icon-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px; height: 72px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.03);
      border: 2px solid ${iconColor};
      color: ${iconColor};
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 24px;
    }
    h1 {
      color: var(--clr-white);
      font-size: 1.8rem; font-weight: 800;
      margin: 0 0 16px 0;
    }
    p {
      font-size: 0.98rem; line-height: 1.6;
      margin: 0 0 28px 0;
      color: #959da5;
    }
    .btn {
      display: inline-block;
      background: var(--clr-primary);
      color: var(--clr-white);
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.15s;
    }
    .btn:hover {
      background: #e06510;
    }
  </style>
</head>
<body>
  <div class="card">
    <a href="https://roam-energy.rauell.systems/" class="logo">ROAM<span>ENERGY</span></a>
    <div>
      <div class="icon-circle">${icon}</div>
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://roam-energy.rauell.systems/" class="btn">Return to Website</a>
  </div>
</body>
</html>
  `;
}
