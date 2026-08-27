const { configured, supabase, hashToken, validatePublicWebsite, scanWebsite, SUPABASE_TABLE } = require('./_lib/ai-readiness');

function tokenFrom(req) { return String(req.query?.token || '').trim(); }
function clean(value, max) { return String(value || '').trim().slice(0, max); }

module.exports = async (req, res) => {
  if (!configured()) return res.status(503).json({ error: 'Online records are being prepared.' });
  const token = tokenFrom(req); if (!token || token.length < 30) return res.status(404).json({ error: 'This private link is invalid or has expired.' });
  const filter = `${SUPABASE_TABLE}?access_token_hash=eq.${hashToken(token)}&access_expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,customer_name,customer_email,business_name,website_url,status,site_scan,intake`;
  try {
    const rows = await supabase(filter); const order = rows[0];
    if (!order) return res.status(404).json({ error: 'This private link is invalid or has expired.' });
    if (req.method === 'GET') return res.status(200).json({ order });
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' }); }
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    if (body.action === 'rescan') {
      const website = await validatePublicWebsite(order.website_url);
      if (!website) return res.status(422).json({ error: 'This website can no longer be safely scanned.' });
      const siteScan = await scanWebsite(website);
      await supabase(`${SUPABASE_TABLE}?id=eq.${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ site_scan: siteScan, updated_at: new Date().toISOString() }) });
      return res.status(200).json({ ok: true, siteScan });
    }
    const list = (values, max) => (Array.isArray(values) ? values : []).map((value) => clean(value, max)).filter(Boolean).slice(0, 20);
    const serviceAreas = Array.isArray(body.serviceAreas) ? body.serviceAreas.map((area) => ({ suburb: clean(area?.suburb, 160), radius: clean(area?.radius, 80) })).filter((area) => area.suburb && area.radius).slice(0, 20) : [];
    const intake = {
      services: list(body.services, 300),
      serviceAreas,
      contact: { phone: clean(body.contact?.phone, 120), email: clean(body.contact?.email, 160), address: { line1: clean(body.contact?.address?.line1, 200), suburb: clean(body.contact?.address?.suburb, 120), state: clean(body.contact?.address?.state, 80), postcode: clean(body.contact?.address?.postcode, 20), country: clean(body.contact?.address?.country, 80) } },
      faqs: clean(body.faqs, 5000), notes: clean(body.notes, 5000),
    };
    if (!intake.services.length || !intake.serviceAreas.length || (!intake.contact.phone && !intake.contact.email)) return res.status(400).json({ error: 'Please add at least one service, service area, and a public phone number or email.' });
    await supabase(`${SUPABASE_TABLE}?id=eq.${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ intake, status: 'intake_submitted', updated_at: new Date().toISOString() }) });
    return res.status(200).json({ ok: true });
  } catch (_error) { return res.status(500).json({ error: 'Your details could not be saved. Please try again.' }); }
};
