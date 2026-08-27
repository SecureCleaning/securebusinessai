const crypto = require('node:crypto');
const { configured, supabase, hashToken, newAccessToken, SUPABASE_TABLE } = require('./_lib/ai-readiness');
const { buildStarterGuideEmail } = require('./_lib/starter-guide-email');

const FROM_EMAIL = 'Secure Business AI <website@securebusinessai.com.au>';
const DESTINATION_EMAIL = 'info@securebusinessai.com.au';
const DEFAULT_SITE_URL = 'https://securebusinessai.com.au';
const STARTER_GUIDE_TABLE = 'starter_guide_orders';
const STARTER_GUIDE_AMOUNT = 4700; // $47 AUD, used only as a fallback identifier

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function customerEmailHtml(name, link) {
  const safeName = escapeHtml(name || 'there');
  const safeLink = escapeHtml(link);
  return `<!doctype html><html><body style="margin:0;background:#f3f7fb;font-family:Arial,Helvetica,sans-serif;color:#14253d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden"><tr><td style="padding:28px 36px;background:#0b4c5c"><img src="https://securebusinessai.com.au/assets/secure-business-ai-horizontal.png" width="230" alt="Secure Business AI" style="display:block;max-width:230px;height:auto" /></td></tr><tr><td style="padding:36px"><p style="margin:0 0 12px;font-size:13px;font-weight:bold;letter-spacing:1px;color:#2f74ff">AI READINESS PACK</p><h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;color:#14253d">Your payment is confirmed.</h1><p style="margin:0 0 16px;font-size:16px;line-height:1.6">Hi ${safeName},</p><p style="margin:0 0 24px;font-size:16px;line-height:1.6">Thank you for choosing Secure Business AI. Your private online workspace is ready for you to review the public website information we found and add anything missing.</p><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:6px;background:#2f74ff"><a href="${safeLink}" style="display:inline-block;padding:14px 22px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none">Open your private details page</a></td></tr></table><p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#516277">This secure link expires in 14 days. Please do not send passwords, payment information, or website login details.</p></td></tr><tr><td style="padding:20px 36px;background:#eef4f7;font-size:13px;line-height:1.5;color:#516277">Secure Business AI<br />Practical, secure AI support for Australian small businesses.</td></tr></table></td></tr></table></body></html>`;
}

// Deliver the fixed Starter Guide PDF for a paid $47 checkout. Idempotent: a
// row in starter_guide_orders marks delivery, so a Stripe retry will not send a
// second copy. The customer email is the critical step; if it fails we throw so
// Stripe retries, and the row is only marked delivered after a successful send.
async function deliverStarterGuide(session, res) {
  const customerEmail = session.customer_details?.email || session.customer_email;
  if (!customerEmail) return res.status(200).json({ received: true });
  const customerName = session.customer_details?.name || '';
  const sessionId = session.id;

  const existing = await supabase(
    `${STARTER_GUIDE_TABLE}?stripe_session_id=eq.${encodeURIComponent(sessionId)}&select=delivered_at`
  );
  if (existing.length && existing[0].delivered_at) return res.status(200).json({ received: true });

  const emailResponse = await sendEmail(buildStarterGuideEmail(customerEmail, customerName));
  if (!emailResponse.ok) throw new Error('Starter Guide email failed');

  // Record the sale and mark delivered (upsert on the session id primary key).
  await supabase(STARTER_GUIDE_TABLE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      stripe_session_id: sessionId,
      customer_email: customerEmail,
      customer_name: customerName || null,
      amount_total: session.amount_total,
      currency: session.currency,
      delivered_at: new Date().toISOString(),
    }),
  });

  // Best-effort internal notification: the customer already has the guide.
  try {
    const notify = await sendEmail({
      from: FROM_EMAIL,
      to: [DESTINATION_EMAIL],
      reply_to: customerEmail,
      subject: `AI Starter Guide sold: ${customerName || customerEmail}`,
      text: `A $47 AI Starter Guide payment was received and the PDF was emailed.\n\nCustomer: ${customerName || 'Not provided'}\nEmail: ${customerEmail}\nStripe session: ${sessionId}`,
    });
    if (!notify.ok) console.error('Starter Guide internal notification failed for session', sessionId);
  } catch (_notifyError) {
    console.error('Starter Guide internal notification error for session', sessionId);
  }

  return res.status(200).json({ received: true });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function validSignature(rawBody, signature, secret) {
  const parts = String(signature || '').split(',').reduce((result, part) => {
    const [key, value] = part.split('='); if (key && value) result[key] = value; return result;
  }, {});
  if (!parts.t || !parts.v1 || Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${rawBody.toString('utf8')}`).digest('hex');
  const actual = Buffer.from(parts.v1, 'hex'); const calculated = Buffer.from(expected, 'hex');
  return actual.length === calculated.length && crypto.timingSafeEqual(actual, calculated);
}

async function sendEmail(payload) {
  return fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  if (!configured() || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.RESEND_API_KEY) return res.status(503).send('Webhook not configured');
  try {
    const raw = await readRawBody(req);
    if (!validSignature(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)) return res.status(400).send('Invalid signature');
    const event = JSON.parse(raw.toString('utf8'));
    if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return res.status(200).json({ received: true });
    const session = event.data?.object;
    if (session?.payment_status !== 'paid') return res.status(200).json({ received: true });

    const product = session?.metadata?.product;

    // AI Starter Guide: fixed PDF deliverable. Identify by the payment link's
    // product metadata (snapshotted onto the session), with the $47 AUD amount
    // as a fallback in case a link is ever created without that metadata.
    if (product === 'ai_starter_guide' || (!product && session.amount_total === STARTER_GUIDE_AMOUNT && session.currency === 'aud')) {
      return await deliverStarterGuide(session, res);
    }

    // AI Readiness Pack: workspace-link flow (order created before checkout).
    if (product !== 'ai_readiness_pack' || !session.metadata.order_id) return res.status(200).json({ received: true });
    const orderId = session.metadata.order_id;
    const existing = await supabase(`${SUPABASE_TABLE}?id=eq.${encodeURIComponent(orderId)}&select=status,customer_name,access_email_sent_at`);
    if (!existing.length) return res.status(200).json({ received: true });
    if (existing[0].access_email_sent_at) return res.status(200).json({ received: true });
    const token = newAccessToken(); const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
    const link = `${siteUrl}/ai-readiness-details?token=${encodeURIComponent(token)}`;
    const customerEmail = session.customer_details?.email || session.customer_email;
    if (!customerEmail) return res.status(200).json({ received: true });
    const customerName = session.customer_details?.name || existing[0].customer_name;
    // The customer's workspace link is the critical email. Send it first; if it
    // fails, throw so Stripe retries. The order is not yet marked paid, so the
    // access_email_sent_at guard above will let the retry proceed.
    const customerEmailResponse = await sendEmail({ from: FROM_EMAIL, to: [customerEmail], reply_to: DESTINATION_EMAIL, subject: 'Your AI Readiness Pack workspace is ready', text: `Hi ${customerName || 'there'},\n\nThank you for choosing Secure Business AI. Open your private online details page to review the website information we found and add anything missing:\n\n${link}\n\nThis secure link expires in 14 days. Please do not send passwords, payment information, or website login details.`, html: customerEmailHtml(customerName, link) });
    if (!customerEmailResponse.ok) throw new Error('Customer email failed');

    // Persist paid + token hash immediately so a Stripe retry cannot mint a
    // second token or email the customer a different link (idempotency).
    await supabase(`${SUPABASE_TABLE}?id=eq.${encodeURIComponent(orderId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'paid', stripe_session_id: session.id, customer_email: customerEmail, access_token_hash: hashToken(token), access_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), access_email_sent_at: new Date().toISOString() }) });

    // The internal notification is best-effort: the customer is already served
    // and the order is marked paid, so a failure here must not strand them.
    try {
      const notificationResponse = await sendEmail({ from: FROM_EMAIL, to: [DESTINATION_EMAIL], reply_to: customerEmail, subject: `AI Readiness Pack paid: ${customerName || customerEmail}`, text: `A $495 AI Readiness Pack payment was received.\n\nCustomer: ${customerName || 'Not provided'}\nEmail: ${customerEmail}\nStripe session: ${session.id}\n\nThe customer has been emailed their private online details link.` });
      if (!notificationResponse.ok) console.error('Readiness internal notification failed for order', orderId);
    } catch (_notifyError) {
      console.error('Readiness internal notification error for order', orderId);
    }

    return res.status(200).json({ received: true });
  } catch (_error) { return res.status(500).send('Webhook failed'); }
};

module.exports.config = { api: { bodyParser: false } };
