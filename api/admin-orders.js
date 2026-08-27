// Read-only internal orders view for the AI Readiness Pack.
// Auth: "Authorization: Bearer <ADMIN_PASSWORD>" (same password as the content admin),
// verified server-side with a timing-safe check. Data is read with the Supabase
// service role. Returns order status and contact fields for the owner only.

const crypto = require('node:crypto');
const { configured, supabase } = require('./_lib/ai-readiness');
const { buildStarterGuideEmail, sendResendEmail } = require('./_lib/starter-guide-email');

const ORDERS_TABLE = 'ai_readiness_orders';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseBody(body) {
  if (typeof body !== 'string') return body || {};
  try { return JSON.parse(body || '{}'); } catch (_error) { return {}; }
}

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const header = String(req.headers['authorization'] || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!configured() || !process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Admin is not configured yet.' });
  }
  if (!authorized(req)) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const body = parseBody(req.body);
  const { action } = body;

  try {
    if (action === 'login') return res.status(200).json({ ok: true });

    if (action === 'send_sample') {
      // Email the real Starter Guide PDF (the exact buyer deliverable) to an
      // address of the owner's choosing, so they can preview or re-send it.
      if (!process.env.RESEND_API_KEY) {
        return res.status(503).json({ error: 'Email sending is not configured.' });
      }
      const email = String(body.email || '').trim();
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
      const response = await sendResendEmail(buildStarterGuideEmail(email, ''));
      if (!response.ok) return res.status(502).json({ error: 'The email could not be sent.' });
      return res.status(200).json({ ok: true, sentTo: email });
    }

    if (action === 'list') {
      const rows = await supabase(
        `${ORDERS_TABLE}?select=id,status,business_name,website_url,customer_name,customer_email,created_at,updated_at,access_expires_at,access_email_sent_at,intake&order=created_at.desc`
      );
      const orders = (rows || []).map((r) => ({
        id: r.id,
        status: r.status,
        business_name: r.business_name,
        website_url: r.website_url,
        customer_name: r.customer_name,
        customer_email: r.customer_email,
        created_at: r.created_at,
        updated_at: r.updated_at,
        access_expires_at: r.access_expires_at,
        workspace_emailed: !!r.access_email_sent_at,
        intake_filled: !!(r.intake && Object.keys(r.intake).length),
      }));
      return res.status(200).json({ orders });
    }

    if (action === 'purge_abandoned') {
      // Remove checkout_started drafts older than 7 days that never paid
      // (no workspace email was ever sent). Never touches paid/intake orders.
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const removed = await supabase(
        `${ORDERS_TABLE}?status=eq.checkout_started&access_email_sent_at=is.null&created_at=lt.${encodeURIComponent(cutoff)}`,
        { method: 'DELETE', headers: { Prefer: 'return=representation' } }
      );
      return res.status(200).json({ ok: true, purged: Array.isArray(removed) ? removed.length : 0 });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (_error) {
    return res.status(500).json({ error: 'The request could not be completed.' });
  }
};
