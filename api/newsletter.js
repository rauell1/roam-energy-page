import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { appConfig, validateEnvironment } from './config.js';

const ALLOWED_ADMIN_EMAIL = 'roy.otieno@roam-electric.com';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function getAuthorizedUser(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const supabase = createClient(
    appConfig.supabase.url,
    appConfig.supabase.serviceKey
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  if (user.email !== ALLOWED_ADMIN_EMAIL) return null;
  return user;
}

// Convert markdown-like syntax to basic HTML
function parseMarkdownToHtml(text) {
  if (!text) return '';
  
  // 1. Escape HTML first to prevent XSS injection in raw newsletter body
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // 2. Bold text **bold**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // 3. Links [text](url) - note we restore < and > specifically for link tags
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
    // Basic URL validation
    const cleanUrl = url.trim().replace(/"/g, '&quot;');
    return `<a href="${cleanUrl}" style="color: #f47920; text-decoration: underline; font-weight: 600;">${linkText}</a>`;
  });
  
  // 4. Paragraphs (split by double or single newlines)
  const paragraphs = escaped
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #4a4a4a;">${p.replace(/\n/g, '<br>')}</p>`);
    
  return paragraphs.join('');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authenticate the Admin User
  const user = await getAuthorizedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Validate Environment
  try {
    validateEnvironment();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const { subject, title, content } = req.body || {};

  if (!subject || !content) {
    return res.status(400).json({ error: 'Subject and Content are required fields.' });
  }

  const emailTitle = title || 'Roam Energy News';
  const htmlBodyContent = parseMarkdownToHtml(content);

  try {
    const supabase = createClient(
      appConfig.supabase.url,
      appConfig.supabase.serviceKey
    );

    // 3. Fetch all subscribers
    const { data: subscribers, error: dbError } = await supabase
      .from('subscribers')
      .select('email')
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    if (!subscribers || subscribers.length === 0) {
      return res.status(200).json({ 
        message: 'No subscribers found. Broadcast not sent.', 
        sentCount: 0 
      });
    }

    // 4. Initialize Resend
    const resend = new Resend(appConfig.email.apiKey);
    const fromAddress = appConfig.email.fromAddress;

    const results = {
      success: [],
      failed: []
    };

    // 5. Send individually to support unique unsubscribe links
    const sendPromises = subscribers.map(async (subscriber) => {
      const email = subscriber.email.trim();
      const unsubUrl = `https://roam-energy.vercel.app/api/unsubscribe?email=${encodeURIComponent(email)}`;
      
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f9fc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
          <!-- Header -->
          <tr style="background-color: #0b0c10; text-align: center;">
            <td style="padding: 30px 20px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 24px; font-weight: 800; letter-spacing: 0.1em; color: #ffffff; text-decoration: none; font-family: Arial, sans-serif;">ROAM<span style="color: #f47920;">ENERGY</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Banner Title -->
          <tr>
            <td style="padding: 35px 40px 15px 40px; text-align: left;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #1a1a1a; line-height: 1.3;">${emailTitle}</h1>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 10px 40px 30px 40px; text-align: left; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
              ${htmlBodyContent}
            </td>
          </tr>
          
          <!-- CTA / Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="border-top: 1px solid #e1e8ed; height: 1px;"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #fafbfd;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #7a7a7a; font-weight: 600;">
                Roam Energy Solar Solutions
              </p>
              <p style="margin: 0 0 20px 0; font-size: 12px; color: #9a9a9a; line-height: 1.4;">
                This newsletter was sent to you because you subscribed at <a href="https://roam-energy.vercel.app" style="color: #f47920; text-decoration: none;">roam-energy.vercel.app</a>.
              </p>
              <table align="center" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="${unsubUrl}" style="background-color: #ffffff; border: 1px solid #d1d5db; color: #4b5563; font-size: 12px; font-weight: 600; text-decoration: none; padding: 8px 16px; border-radius: 6px; display: inline-block; transition: background-color 0.15s;">
                      Unsubscribe from List
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      try {
        await resend.emails.send({
          from: `Roam Energy <${fromAddress}>`,
          to: email,
          subject: subject,
          html: emailHtml
        });
        results.success.push(email);
      } catch (err) {
        console.error(`Resend failed for ${email}:`, err);
        results.failed.push({ email, error: err.message });
      }
    });

    await Promise.all(sendPromises);

    return res.status(200).json({
      message: `Broadcast completed. Sent: ${results.success.length}, Failed: ${results.failed.length}`,
      sentCount: results.success.length,
      failedCount: results.failed.length,
      failedList: results.failed
    });

  } catch (err) {
    console.error('Newsletter broadcast error:', err);
    return res.status(500).json({ error: err.message });
  }
}
