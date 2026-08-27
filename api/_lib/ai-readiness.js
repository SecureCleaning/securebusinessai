const crypto = require('node:crypto');
const dns = require('node:dns').promises;
const net = require('node:net');

const SUPABASE_TABLE = 'ai_readiness_orders';

function configured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: process.env.SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
    ...extra,
  };
}

async function supabase(path, options = {}) {
  const baseUrl = process.env.SUPABASE_URL.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: supabaseHeaders(options.headers),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Customer record could not be saved.');
  return data;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function newAccessToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function isBlockedIp(address) {
  if (net.isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  const lower = address.toLowerCase();
  return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:');
}

async function validatePublicWebsite(value) {
  const input = String(value || '').trim();
  const normalised = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  let url;
  try {
    url = new URL(normalised);
  } catch (_error) {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) return null;
  try {
    const addresses = await dns.lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some(({ address }) => isBlockedIp(address))) return null;
  } catch (_error) {
    return null;
  }
  return url;
}

function textMatch(html, expression) {
  const match = html.match(expression);
  return match ? match[1].replace(/\s+/g, ' ').trim() : '';
}

function collectJsonLd(value, contact, services = []) {
  if (Array.isArray(value)) return value.forEach((item) => collectJsonLd(item, contact, services));
  if (!value || typeof value !== 'object') return;
  if (!contact.phone && typeof value.telephone === 'string') contact.phone = value.telephone;
  if (!contact.email && typeof value.email === 'string') contact.email = value.email;
  if (value.address && typeof value.address === 'object') {
    contact.address.line1 ||= value.address.streetAddress || '';
    contact.address.suburb ||= value.address.addressLocality || '';
    contact.address.state ||= value.address.addressRegion || '';
    contact.address.postcode ||= value.address.postalCode || '';
    contact.address.country ||= value.address.addressCountry || '';
  }
  const type = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
  if (type.some((item) => /service/i.test(String(item))) && typeof value.name === 'string') services.push(value.name);
  if (typeof value.serviceType === 'string') services.push(value.serviceType);
  if (value.itemOffered) collectJsonLd(value.itemOffered, contact, services);
  Object.entries(value).forEach(([key, item]) => {
    if (key !== 'itemOffered') collectJsonLd(item, contact, services);
  });
}

function unique(values, limit = 12) {
  return [...new Set(values.map((value) => String(value || '').replace(/\s+/g, ' ').trim()).filter((value) => value && value.length < 120))].slice(0, limit);
}

function contactFromHtml(html, services = []) {
  const contact = { phone: '', email: '', address: { line1: '', suburb: '', state: '', postcode: '', country: 'Australia' } };
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { collectJsonLd(JSON.parse(match[1]), contact, services); } catch (_error) {}
  }
  contact.email ||= textMatch(html, /mailto:([^"'?#\s]+)/i);
  contact.phone ||= textMatch(html, /tel:([^"'?#<]+)/i);
  contact.email ||= (html.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i) || [])[0] || '';
  const text = textContent(html);
  contact.phone ||= (text.match(/\b(?:13\d{2}|1300|1800)\s?\d{3}\s?\d{3}\b/) || text.match(/(?:\+61\s?|0)(?:\(?\d\)?\s?\d{4}\s?\d{4}|4\d{2}\s?\d{3}\s?\d{3})/) || [])[0] || '';
  const address = text.match(/(\d{1,5}(?:\/\d{1,5})?\s+[A-Za-z0-9 .'-]{3,80}?),\s*([A-Z][A-Za-z -]{1,60}?)\s+(VIC|NSW|QLD|SA|WA|TAS|ACT|NT)\s+(\d{4})(?:\s+(Australia))?/);
  if (address) {
    contact.address.line1 ||= address[1].trim();
    contact.address.suburb ||= address[2].trim();
    contact.address.state ||= address[3];
    contact.address.postcode ||= address[4];
    contact.address.country ||= address[5] || 'Australia';
  }
  return contact;
}

function mergeContact(target, source) {
  if (!source) return target;
  target.phone ||= source.phone || '';
  target.email ||= source.email || '';
  Object.keys(target.address).forEach((key) => { target.address[key] ||= source.address?.[key] || ''; });
  return target;
}

function textContent(value) {
  return String(value || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
}

function linksFromHtml(html, baseUrl) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = new URL(match[1], baseUrl);
      if (!['http:', 'https:'].includes(url.protocol) || url.hostname !== baseUrl.hostname) continue;
      url.hash = '';
      url.search = '';
      if (/\/(?:login|sign-in|signin|register|account|dashboard|admin|checkout|cart)(?:\/|$)/i.test(url.pathname)) continue;
      if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|docx?|xlsx?)$/i.test(url.pathname)) continue;
      const label = textContent(match[2]);
      links.push({ url: url.href, label, priority: /contact|service|faq|question|location|area|about|team|product|pricing/i.test(`${url.pathname} ${label}`) ? 0 : 1 });
    } catch (_error) {}
  }
  return links;
}

function serviceHints(html, pageUrl) {
  const isServicePage = /service|product|offer|solution/i.test(pageUrl.pathname);
  const hints = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']*(?:service|product|offer|solution)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) hints.push(textContent(match[2]));
  if (isServicePage) for (const match of html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)) hints.push(textContent(match[1]));
  return unique(hints.filter((hint) => hint.length > 2 && hint.length < 80 && !/^(services?|products?|offers?|solutions?)$/i.test(hint)), 12);
}

function areaHints(html) {
  const found = [];
  for (const match of html.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*,?\s*(VIC|NSW|QLD|SA|WA|TAS|ACT|NT)\s*(\d{4})?\b/g)) {
    found.push(match[3] ? `${match[1]} ${match[2]} ${match[3]}` : `${match[1]} ${match[2]}`);
  }
  return unique(found, 8).map((suburb) => ({ suburb, radius: '25 km' }));
}

async function fetchPublicHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'SecureBusinessAI-Readiness/1.0 (+https://securebusinessai.com.au)' }, redirect: 'manual', signal: controller.signal });
    if (!response.ok || response.status >= 300 || response.status < 200) return null;
    if (!(response.headers.get('content-type') || '').includes('text/html')) return null;
    return (await response.text()).slice(0, 750000);
  } catch (_error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function sitemapUrls(root) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(new URL('/sitemap.xml', root), { headers: { 'User-Agent': 'SecureBusinessAI-Readiness/1.0 (+https://securebusinessai.com.au)' }, redirect: 'manual', signal: controller.signal });
    if (!response.ok) return [];
    const xml = (await response.text()).slice(0, 500000);
    const urls = [];
    for (const match of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
      try {
        const url = new URL(match[1]);
        if (url.hostname === root.hostname && !/\/(?:login|sign-in|signin|register|account|dashboard|admin|checkout|cart)(?:\/|$)/i.test(url.pathname) && !/\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|docx?|xlsx?)$/i.test(url.pathname)) urls.push({ url: url.href, label: '', priority: /contact|service|faq|question|location|area|about|team|product|pricing/i.test(url.pathname) ? 0 : 1 });
      } catch (_error) {}
    }
    return urls;
  } catch (_error) {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function scanWebsite(url) {
  const homepageHtml = await fetchPublicHtml(url);
  if (!homepageHtml) throw new Error('Website could not be scanned.');
  const root = new URL(url);
  const contact = contactFromHtml(homepageHtml, []);
  const services = [];
  const serviceAreas = areaHints(homepageHtml);
  const homeContact = contactFromHtml(homepageHtml, services);
  mergeContact(contact, homeContact);
  services.push(...serviceHints(homepageHtml, root));

  const discovered = [...linksFromHtml(homepageHtml, root), ...(await sitemapUrls(root))].sort((a, b) => a.priority - b.priority);
  const seen = new Set([root.href]);
  const pages = [{ url: root.href, title: textMatch(homepageHtml, /<title[^>]*>([\s\S]*?)<\/title>/i) }];
  const queue = [];
  for (const link of discovered) {
    if (seen.has(link.url)) continue;
    seen.add(link.url);
    queue.push(link);
    if (queue.length === 11) break;
  }
  await Promise.all(queue.map(async ({ url: pageUrl }) => {
    const html = await fetchPublicHtml(pageUrl);
    if (!html) return;
    const page = new URL(pageUrl);
    mergeContact(contact, contactFromHtml(html, services));
    services.push(...serviceHints(html, page));
    serviceAreas.push(...areaHints(html));
    pages.push({ url: pageUrl, title: textMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i) });
  }));
  return {
    scannedAt: new Date().toISOString(),
    pageTitle: pages[0].title,
    description: textMatch(homepageHtml, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || textMatch(homepageHtml, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i),
    canonicalUrl: textMatch(homepageHtml, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i),
    hasSchema: /application\/ld\+json/i.test(homepageHtml),
    hasLlmstxt: false,
    contact,
    services: unique(services, 12),
    serviceAreas: unique(serviceAreas.map((area) => area.suburb), 8).map((suburb) => ({ suburb, radius: '25 km' })),
    pagesScanned: pages.slice(0, 12),
  };
}

module.exports = { configured, supabase, hashToken, newAccessToken, validatePublicWebsite, scanWebsite, SUPABASE_TABLE };
