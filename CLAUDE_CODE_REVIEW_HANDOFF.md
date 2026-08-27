# Secure Business AI: Claude Code Review Handoff

## Your role

Act as a senior product, UX, security, and web-engineering reviewer. Review this repository and compare the local project with the live production website. Identify practical improvements that make the site clearer, more credible, easier to use, and safer to operate for Australian small-business customers.

**Do not edit, deploy, change environment variables, or trigger live payments unless explicitly asked after your review.** Start with analysis and recommendations only.

## Project

- Local project root: the folder containing this document
- Production website: https://securebusinessai.com.au
- Vercel project: `securebusinessai-156b`
- Deployment style: static HTML/CSS/JavaScript with Vercel serverless API endpoints
- Node version: 20 or newer
- Package manager: npm

## What the business offers

Secure Business AI helps Australian small businesses adopt AI in practical, understandable ways. Current public offers include:

- AI Starter Guide
- AI Readiness Pack: $495 one-time service
- AI Website Review
- Website chatbots and AI voice receptionist advice
- General AI implementation enquiries

The tone should remain plain-English, reassuring, practical, and not overly technical. Avoid promises of rankings, AI citations, or guaranteed lead outcomes.

## Public pages that should be reviewed

- https://securebusinessai.com.au/
- https://securebusinessai.com.au/ai-starter-guide
- https://securebusinessai.com.au/supplier-ai-readiness
- https://securebusinessai.com.au/ai-website-review
- https://securebusinessai.com.au/contact
- https://securebusinessai.com.au/ai-readiness-start
- https://securebusinessai.com.au/sitemap.xml
- https://securebusinessai.com.au/robots.txt
- https://securebusinessai.com.au/llms.txt

Do not attempt to access, enumerate, or index private customer URLs such as `/ai-readiness-details?token=...`.

## Current AI Readiness Pack flow

1. A visitor enters their name, email, business name, and public website at `/ai-readiness-start`.
2. The server checks a bounded set of public website pages and collects public signals such as service names, contact details, address clues, and service-area clues.
3. The visitor reviews a plain-English summary and continues to Stripe Checkout for the $495 product. Promotion codes are enabled.
4. A verified Stripe webhook marks the order as paid, stores the record in Supabase, and sends the buyer a private details link through Resend.
5. The buyer reviews the discovered information, adds services, service areas, contact information, customer options, FAQs, and custom business points.
6. Secure Business AI prepares the editable delivery pack. This final document/file-generation stage is not yet fully automated and is an important improvement opportunity.

## External services and boundaries

Configured production integrations include Stripe, Supabase, and Resend. Secrets are held in Vercel environment variables and must never be printed, copied into code, or requested in chat.

Do not:

- Make a live Stripe payment, refund, coupon change, or webhook request.
- Send real customer emails.
- Modify Supabase data or schema.
- Change Vercel settings, domains, or environment variables.
- Test private token links, login pages, or admin-like endpoints.

For safe verification, use static inspection, normal public GET requests, local tests, and mocked endpoints only.

## Local commands

```bash
npm install
npm run lint
npm test
npm run build
```

`npm run lint` performs JavaScript syntax checks and site-link validation. `npm test` uses mocked email behaviour and must not send real messages. `npm run build` copies the deployable static files to `dist/`.

## Key implementation files

- `index.html`, `ai-starter-guide.html`, `supplier-ai-readiness.html`, `ai-website-review.html`, `contact.html`: public pages
- `styles.css`: shared visual system
- `chatbot.js`: public chatbot UI and enhancements for the private readiness details form
- `api/ai-readiness-start.js`: public website scan, Supabase draft order, Stripe Checkout creation
- `api/_lib/ai-readiness.js`: public scan and safe URL handling
- `api/stripe-webhook.js`: Stripe event verification and buyer/internal notifications
- `api/ai-readiness-order.js`: token-protected private order read/update endpoint
- `ai-readiness-details.html`: buyer information-confirmation form
- `supabase/ai_readiness_orders.sql`: order table setup
- `sitemap.xml`, `robots.txt`, `llms.txt`: crawler-facing files
- `docs/generated/cleaningworks-ai-readiness/`: sample delivery artefacts for the AI Readiness Pack

## Known context

- The site is intentionally at an early business-launch stage; content should feel trustworthy rather than over-produced.
- The AI Readiness Pack form has recently been improved to crawl a limited number of same-domain public pages, skip private/account/checkout pages, and pre-fill public business information.
- Current product documentation and the README contain some older wording; flag any discrepancies between documentation, source, and live behaviour.
- `sitemap.xml` is intentionally limited to core public pages. Checkout, private forms, payment success pages, and development pages must not be added.
- `llms.txt` is a public factual summary, not a Google ranking tactic and must never contain private information.

## Review brief

Assess the following areas:

1. **Customer experience and conversion**
   - Is the main offer immediately clear?
   - Are calls to action understandable and consistent?
   - Is the $495 AI Readiness Pack flow credible and low-friction?
   - Are post-payment expectations, email delivery, and next steps clear?

2. **Content and business positioning**
   - Identify unclear, repetitive, overly technical, weak, or missing copy.
   - Recommend concise changes that help a non-technical small-business owner understand the value.
   - Identify which offers should be clarified, separated, combined, or deferred.

3. **Design, accessibility, and mobile quality**
   - Check visual hierarchy, spacing, readability, navigation consistency, contrast, keyboard behaviour, labels, error states, and responsive layouts.
   - Flag pages or controls that feel unfinished, generic, or confusing.

4. **Technical SEO and public discoverability**
   - Check canonical URLs, metadata, headings, sitemap coverage, robots rules, internal linking, response status, and indexability.
   - Recommend improvements that are legitimate and useful. Do not recommend keyword stuffing or claims about guaranteed rankings.

5. **Security and operational reliability**
   - Review public input validation, token protection, webhook handling, safe public-site scanning, rate/abuse risks, errors, and failure handling.
   - Identify what should be logged, retried, monitored, or made more explicit to the business owner.

6. **Delivery automation roadmap**
   - Recommend the smallest sensible next step for turning a paid, submitted readiness order into an editable client delivery pack.
   - Include an operational handover path for small-business clients who do not have IT support. Avoid requiring customers to understand or install schema themselves.

## Required review output

Create a Markdown report at:

```text
docs/CLAUDE_CODE_REVIEW.md
```

Use this format:

1. **Executive summary**: no more than 10 bullets.
2. **Findings**: ordered by severity/impact, with file paths, public URLs, or code references.
3. **Quick wins**: changes that can be completed safely in one focused pass.
4. **Product and conversion recommendations**: prioritised as Now / Next / Later.
5. **Security and reliability recommendations**: practical, proportionate, and specific.
6. **Open questions**: only decisions that genuinely require the owner.
7. **Suggested implementation plan**: small, independent steps with tests or validation for each.

For every recommendation, distinguish between:

- a confirmed defect or risk;
- a recommended improvement; and
- an optional experiment.

Do not make code changes until the owner chooses which recommendations to implement.

