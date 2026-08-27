const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const files = [
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
  'docs/generated/ai-website-review-jimsmowing-sample-2026-05-13.md',
];

fs.rmSync(dist, { recursive: true, force: true });

for (const file of files) {
  const source = path.join(root, file);
  const target = path.join(dist, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

console.log(`Built ${files.length} files into dist/.`);
