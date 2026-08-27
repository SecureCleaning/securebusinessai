# Secure Business AI

Static lead-generation site for Secure Business AI with a Vercel serverless contact form powered by Resend.

## Requirements

- Node.js 20+
- npm
- Vercel CLI for full local API testing

## Local Setup

```bash
npm install
cp .env.example .env
```

Add a local `RESEND_API_KEY` value before testing the live contact form.

## Development

Run the Vercel development server when you need `/api/contact`:

```bash
npm run dev
```

Expected URL:

```text
http://localhost:3000
```

For static page preview only:

```bash
npm run dev:static
```

## Validation

```bash
npm run lint
npm test
npm run build
```

The test suite mocks Resend and does not send real email.

## Deployment

- Deploy target: Vercel
- Add domain: `preview.securebusinessai.com.au`
- Follow Vercel's DNS instructions in Hostinger
- Configure `RESEND_API_KEY` in Vercel project environment variables
- Configure `STRIPE_SECRET_KEY` and `STRIPE_AI_READINESS_PRICE_ID` for the $495 AI Readiness Pack. Checkout sessions are created server-side and return the customer to the payment confirmation page.

## Files

- `index.html` - homepage
- `ai-website-review.html` - paid review offer page
- `review-intake.html` - post-purchase intake form
- `ai-readiness-intake.html` - post-purchase AI Readiness Pack intake form
- `contact.html` - enquiry form
- `contact-success.html` - post-submit confirmation
- `styles.css` - site styles
- `api/contact.js` - Vercel serverless contact endpoint
- `api/review-checkout.js` - checkout redirect for AI Website Review
- `api/review-intake.js` - post-purchase intake endpoint
- `api/ai-readiness-checkout.js` - checkout redirect for the $495 AI Readiness Pack
- `api/ai-readiness-intake.js` - post-purchase AI Readiness Pack intake endpoint

## Stripe Configuration

Add these variables in Vercel for Production and Preview:

- `STRIPE_SECRET_KEY` - Stripe restricted or secret API key; never expose it in browser code.
- `STRIPE_AI_READINESS_PRICE_ID` - the $495 Stripe Price ID.
- `SITE_URL` - `https://securebusinessai.com.au`.

The next implementation stage adds a webhook and database. It will verify the Stripe payment event, create the private online job record, and email the customer their unique details link.
- `docs/AI_WEBSITE_REVIEW_PROCESS.md` - purchase-to-report delivery workflow
- `vercel.json` - Vercel clean URL config
