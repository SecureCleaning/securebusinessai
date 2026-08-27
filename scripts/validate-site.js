const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'index.html',
  'ai-starter-guide.html',
  'ai-readiness-pack.html',
  'ai-website-review.html',
  'contact.html',
  'services.html',
  'pricing.html',
  'secure-ai-onboarding.html',
  'ai-voice-receptionist.html',
  'website-ai-chatbot.html',
  'ai-business-bundle.html',
  'about.html',
  'privacy.html',
  'terms.html',
  'contact-success.html',
  'review-intake.html',
  'review-intake-success.html',
  'ai-readiness-intake.html',
  'ai-readiness-intake-success.html',
  'ai-readiness-payment-success.html',
  'ai-readiness-start.html',
  'ai-readiness-details.html',
  'styles.css',
  'chatbot.js',
  'llms.txt',
  'sitemap.xml',
  'robots.txt',
  'vercel.json',
  'assets/secure-business-ai-horizontal.png',
  'assets/secure-business-ai-stacked.png',
  'api/contact.js',
  'api/starter-guide-checkout.js',
  'api/review-checkout.js',
  'api/review-intake.js',
  'api/ai-readiness-checkout.js',
  'api/ai-readiness-intake.js',
  'api/ai-readiness-start.js',
  'api/_lib/ai-readiness.js',
  'api/_lib/readiness-pack.js',
  'api/ai-readiness-order.js',
  'api/stripe-webhook.js',
  'api/content.js',
  'api/admin-content.js',
  'api/admin-orders.js',
  'content-overrides.js',
  'admin.html',
  'admin-orders.html',
  '.env.example',
];

const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`Missing required file: ${file}`);
  }
}

const pages = ['index.html', 'ai-starter-guide.html', 'ai-readiness-pack.html', 'ai-website-review.html', 'contact.html', 'services.html', 'pricing.html', 'secure-ai-onboarding.html', 'ai-voice-receptionist.html', 'website-ai-chatbot.html', 'ai-business-bundle.html', 'about.html', 'privacy.html', 'terms.html', 'contact-success.html', 'review-intake.html', 'review-intake-success.html', 'ai-readiness-intake.html', 'ai-readiness-intake-success.html', 'ai-readiness-payment-success.html', 'ai-readiness-start.html', 'ai-readiness-details.html'];
const defaultExpectedNavLinks = [
  'href="/services"',
  'href="/#how"',
  'href="/pricing"',
  'href="/ai-starter-guide"',
  'href="/ai-readiness-pack"',
  'href="/ai-website-review"',
  'href="/contact"',
];
const developmentExpectedNavLinks = [
  'href="/development#services"',
  'href="/development#how"',
  'href="/development#pricing"',
  'href="/ai-starter-guide"',
  'href="/supplier-ai-readiness"',
  'href="/ai-website-review"',
  'href="/contact"',
];
const expectedFooterMarkers = [
  '<footer class="site-footer">',
  'href="/ai-starter-guide"',
  'href="/ai-readiness-pack"',
  'href="/ai-website-review"',
  'href="/contact"',
  'Secure Business AI. All rights reserved.',
];
const existingCleanPaths = new Set([
  '/',
  '/development',
  '/ai-starter-guide',
  '/ai-readiness-pack',
  '/supplier-ai-readiness',
  '/ai-website-review',
  '/contact',
  '/services',
  '/pricing',
  '/secure-ai-onboarding',
  '/ai-voice-receptionist',
  '/website-ai-chatbot',
  '/ai-business-bundle',
  '/about',
  '/privacy',
  '/terms',
  '/contact-success',
  '/review-intake',
  '/review-intake-success',
  '/ai-readiness-intake',
  '/ai-readiness-intake-success',
  '/ai-readiness-payment-success',
  '/ai-readiness-start',
  '/ai-readiness-details',
  '/api/contact',
  '/api/review-checkout',
  '/api/review-intake',
  '/api/starter-guide-checkout',
  '/api/ai-readiness-checkout',
  '/api/ai-readiness-intake',
  '/api/ai-readiness-start',
  '/api/ai-readiness-order',
  '/api/stripe-webhook',
  '/api/content',
  '/api/admin-content',
  '/api/admin-orders',
  '/admin',
  '/admin-orders',
]);
const allowedExternalOrigins = new Set([
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://securebusinessai.com.au',
]);

for (const page of pages) {
  const filePath = path.join(root, page);
  if (!fs.existsSync(filePath)) continue;

  const html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes('<!doctype html>')) {
    errors.push(`${page} is missing an HTML5 doctype.`);
  }
  if (!html.includes('href="./styles.css"')) {
    errors.push(`${page} does not reference ./styles.css.`);
  }
  if (!html.includes('assets/secure-business-ai-horizontal.png')) {
    errors.push(`${page} does not reference the horizontal logo.`);
  }
  if (!html.includes('chatbot.js')) {
    errors.push(`${page} does not load chatbot.js.`);
  }
  const expectedNavLinks = page === 'development.html' ? developmentExpectedNavLinks : defaultExpectedNavLinks;
  for (const link of expectedNavLinks) {
    if (!html.includes(link)) {
      errors.push(`${page} is missing nav link ${link}.`);
    }
  }
  for (const marker of expectedFooterMarkers) {
    if (!html.includes(marker)) {
      errors.push(`${page} is missing footer marker ${marker}.`);
    }
  }
  if (!/<meta\s+name="description"/.test(html)) {
    errors.push(`${page} is missing a meta description.`);
  }

  const linkMatches = html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g);
  for (const match of linkMatches) {
    const target = match[1];
    if (
      target.startsWith('mailto:') ||
      target.startsWith('tel:') ||
      target.startsWith('#') ||
      target.startsWith('data:')
    ) {
      continue;
    }

    if (target.startsWith('http://') || target.startsWith('https://')) {
      const url = new URL(target);
      if (!allowedExternalOrigins.has(url.origin)) {
        errors.push(`${page} links to unapproved external URL: ${target}`);
      }
      continue;
    }

    if (target.startsWith('/')) {
      const [pathOnly] = target.split(/[?#]/);
      if (!existingCleanPaths.has(pathOnly)) {
        errors.push(`${page} links to unknown internal path: ${target}`);
      }
      continue;
    }

    if (target.startsWith('./')) {
      const normalized = target.replace('./', '');
      if (!fs.existsSync(path.join(root, normalized))) {
        errors.push(`${page} references missing relative asset: ${target}`);
      }
      continue;
    }

    errors.push(`${page} has unsupported URL form: ${target}`);
  }
}

const contactHtml = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
for (const expected of ['name="name"', 'name="email"', 'name="service"', 'name="message"', 'fetch(\'/api/contact\'']) {
  if (!contactHtml.includes(expected)) {
    errors.push(`contact.html is missing expected contact form marker: ${expected}`);
  }
}

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
if (!/^RESEND_API_KEY=$/m.test(envExample)) {
  errors.push('.env.example must include RESEND_API_KEY=');
}
if (!/^AI_REVIEW_PAYMENT_LINK=$/m.test(envExample)) {
  errors.push('.env.example must include AI_REVIEW_PAYMENT_LINK=');
}
if (!/^AI_STARTER_GUIDE_PAYMENT_LINK=$/m.test(envExample)) {
  errors.push('.env.example must include AI_STARTER_GUIDE_PAYMENT_LINK=');
}
for (const name of ['STRIPE_SECRET_KEY', 'STRIPE_AI_READINESS_PRICE_ID', 'STRIPE_WEBHOOK_SECRET']) {
  if (!new RegExp(`^${name}=$`, 'm').test(envExample)) {
    errors.push(`.env.example must include ${name}=`);
  }
}
for (const name of ['SUPABASE_URL', 'SUPABASE_SECRET_KEY']) {
  if (!new RegExp(`^${name}=$`, 'm').test(envExample)) {
    errors.push(`.env.example must include ${name}=`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Site validation passed.');
