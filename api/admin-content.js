// Protected admin API for the content editor.
// Auth: send "Authorization: Bearer <ADMIN_PASSWORD>". The password is an env
// var set in Vercel; it is compared server-side with a timing-safe check and is
// never exposed to the browser. All DB access uses the Supabase service role.
//
// Actions (POST JSON body { action, ... }):
//   login  -> verifies the password
//   list   -> returns all saved content rows
//   save   -> upserts an array of { page, section_key, content }

const crypto = require('node:crypto');
const { configured, supabase } = require('./_lib/ai-readiness');

const CONTENT_TABLE = 'page_content';

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

  const { action, items } = parseBody(req.body);

  try {
    if (action === 'login') {
      return res.status(200).json({ ok: true });
    }

    if (action === 'list') {
      const rows = await supabase(`${CONTENT_TABLE}?select=page,section_key,content`);
      return res.status(200).json({ items: rows || [] });
    }

    if (action === 'save') {
      if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
      const clean = items
        .map((item) => ({
          page: String(item.page || '').trim(),
          section_key: String(item.section_key || '').trim(),
          content: String(item.content == null ? '' : item.content),
          updated_by: 'admin',
        }))
        .filter((item) => /^[a-z0-9-]{1,64}$/.test(item.page) && /^[a-z0-9._-]{1,64}$/.test(item.section_key));

      const toUpsert = clean.filter((i) => i.content.length > 0);
      const toDelete = clean.filter((i) => i.content.length === 0);

      if (toUpsert.length) {
        await supabase(CONTENT_TABLE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(toUpsert),
        });
      }

      // A blank field means "revert to the page's default" -> remove the override.
      const byPage = {};
      for (const i of toDelete) { (byPage[i.page] = byPage[i.page] || []).push(i.section_key); }
      for (const p of Object.keys(byPage)) {
        const list = byPage[p].map((k) => encodeURIComponent(k)).join(',');
        await supabase(`${CONTENT_TABLE}?page=eq.${encodeURIComponent(p)}&section_key=in.(${list})`, {
          method: 'DELETE',
          headers: { Prefer: 'return=minimal' },
        });
      }

      return res.status(200).json({ ok: true, saved: toUpsert.length, reverted: toDelete.length });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (_error) {
    return res.status(500).json({ error: 'The request could not be completed.' });
  }
};
