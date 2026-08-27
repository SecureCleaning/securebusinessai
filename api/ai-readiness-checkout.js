const STRIPE_CHECKOUT_URL = 'https://api.stripe.com/v1/checkout/sessions';
const DEFAULT_SITE_URL = 'https://securebusinessai.com.au';

module.exports = async (req, res) => {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_AI_READINESS_PRICE_ID;

  if (!secretKey || !priceId) {
    return res.redirect(302, '/contact');
  }

  const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    customer_creation: 'always',
    billing_address_collection: 'auto',
    allow_promotion_codes: 'true',
    'invoice_creation[enabled]': 'true',
    'managed_payments[enabled]': 'false',
    success_url: `${siteUrl}/ai-readiness-payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/ai-readiness-pack`,
    'metadata[product]': 'ai_readiness_pack',
  });

  try {
    const stripeResponse = await fetch(STRIPE_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const session = await stripeResponse.json().catch(() => ({}));

    if (!stripeResponse.ok || typeof session.url !== 'string' || !session.url.startsWith('https://checkout.stripe.com/')) {
      return res.status(502).json({ error: session.error?.message || 'Checkout could not be started. Please try again.' });
    }

    return res.redirect(303, session.url);
  } catch (_error) {
    return res.status(502).json({ error: 'Checkout could not be started. Please try again.' });
  }
};
