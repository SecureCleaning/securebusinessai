const crypto = require('node:crypto');
const { configured, supabase, hashToken, newAccessToken, validatePublicWebsite, scanWebsite, SUPABASE_TABLE } = require('./_lib/ai-readiness');

const STRIPE_CHECKOUT_URL = 'https://api.stripe.com/v1/checkout/sessions';
const DEFAULT_SITE_URL = 'https://securebusinessai.com.au';

function parseBody(body) {
  if (typeof body !== 'string') return body || {};
  try { return JSON.parse(body || '{}'); } catch (_error) { return {}; }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!configured() || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_AI_READINESS_PRICE_ID) {
    return res.status(503).json({ error: 'Online checkout is being prepared. Please contact us to get started.' });
  }

  const { name, email, business, website, company_website } = parseBody(req.body);
  if (company_website) return res.status(200).json({ ok: true });
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanBusiness = String(business || '').trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanName || !cleanEmail || !cleanBusiness || !emailPattern.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please provide your name, business name, email, and website.' });
  }

  const websiteUrl = await validatePublicWebsite(website);
  if (!websiteUrl) return res.status(400).json({ error: 'Please enter a public website URL.' });

  let scan;
  try { scan = await scanWebsite(websiteUrl); } catch (_error) { return res.status(422).json({ error: 'We could not scan that website. Please check the URL or contact us.' }); }

  const token = newAccessToken();
  const orderId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  try {
    await supabase(SUPABASE_TABLE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        id: orderId,
        status: 'checkout_started',
        customer_email: cleanEmail,
        customer_name: cleanName,
        business_name: cleanBusiness,
        website_url: websiteUrl.href,
        access_token_hash: hashToken(token),
        access_expires_at: expiresAt,
        site_scan: scan,
      }),
    });

    const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
    const checkout = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price]': process.env.STRIPE_AI_READINESS_PRICE_ID,
      'line_items[0][quantity]': '1',
      customer_email: cleanEmail,
      customer_creation: 'always',
      billing_address_collection: 'auto',
      allow_promotion_codes: 'true',
      'invoice_creation[enabled]': 'true',
      'managed_payments[enabled]': 'false',
      success_url: `${siteUrl}/ai-readiness-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/ai-readiness-start`,
      'metadata[order_id]': orderId,
      'metadata[product]': 'ai_readiness_pack',
    });
    const stripeResponse = await fetch(STRIPE_CHECKOUT_URL, { method: 'POST', headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: checkout.toString() });
    const session = await stripeResponse.json().catch(() => ({}));
    if (!stripeResponse.ok || !session.url?.startsWith('https://checkout.stripe.com/')) throw new Error('Checkout could not be created.');
    await supabase(`${SUPABASE_TABLE}?id=eq.${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ stripe_session_id: session.id }) });
    return res.status(200).json({ checkoutUrl: session.url, scan });
  } catch (_error) {
    return res.status(500).json({ error: 'We could not start checkout. Please try again.' });
  }
};
