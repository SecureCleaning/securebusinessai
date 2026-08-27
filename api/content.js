// Public read endpoint for CMS content overrides.
// Returns { content: { "<section_key>": "<text>" } } for a given page.
// Content is public site copy; default copy stays baked into the HTML, so a
// failure or empty store simply means no overrides are applied.

const { configured, supabase, SUPABASE_TABLE } = require('./_lib/ai-readiness');

const CONTENT_TABLE = 'page_content';

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let page = '';
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    page = String(url.searchParams.get('page') || '').trim();
  } catch (_error) {
    page = '';
  }

  if (!page || !/^[a-z0-9-]{1,64}$/.test(page)) {
    return res.status(400).json({ error: 'Invalid page' });
  }

  // No store configured -> no overrides (pages use their baked-in defaults).
  if (!configured()) return res.status(200).json({ content: {} });

  try {
    const rows = await supabase(`${CONTENT_TABLE}?page=eq.${encodeURIComponent(page)}&select=section_key,content`);
    const content = {};
    for (const row of rows || []) content[row.section_key] = row.content;
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.status(200).json({ content });
  } catch (_error) {
    // Fail open: never break a public page because the content store hiccuped.
    return res.status(200).json({ content: {} });
  }
};

// SUPABASE_TABLE imported only to keep a single source for the orders table name
// elsewhere; unused here but harmless.
void SUPABASE_TABLE;
