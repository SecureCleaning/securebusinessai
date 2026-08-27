# Secure Business AI: Project Handoff for Claude

**Prepared:** 20 August 2026 (Australia/Melbourne)  
**Project root:** `/Users/lyle/Documents/Playground/secure-business-ai/secure-business-ai-codex-handoff-2026-05-12/project`  
**Production site:** https://securebusinessai.com.au  
**Vercel project:** `securebusinessai-156b` in the `lyles-projects-1cf7cd8c` team  
**Git remote:** `https://github.com/SecureCleaning/securebusinessai.git`

## Read this first

You are taking over a live, early-stage small-business website and a partially automated paid product workflow. Keep all customer-facing wording plain-English, practical, reassuring, and Australian. Do not promise rankings, AI citations, guaranteed results, or automation that does not exist.

This document is the current source of truth for the project state. Several older documents remain in the repository for useful business context, but some describe superseded flows. See **Historical and superseded files** below.

### Important repository state

The local Git repository is on `main`, has the remote above, but currently has **no commits**. All project files are untracked. Before making substantial changes, inspect the whole worktree and coordinate with the owner before initialising a clean commit history or force-pushing anything. Do not discard or overwrite existing files.

### Secrets and access

Secrets are intentionally not included in this handoff. Do not ask for, print, commit, copy, or paste secret values. To take over deployment and live integration work, Claude needs owner-granted access to:

- Vercel project `securebusinessai-156b`
- Stripe account for Secure Business AI
- Supabase project containing `ai_readiness_orders`
- Resend account/domain for `securebusinessai.com.au`
- GitHub repository `SecureCleaning/securebusinessai`
- Hostinger only if DNS/domain records need changing

Use `.env.example` for variable names only. Local secret files must remain ignored by Git.

## Business and product context

Secure Business AI helps Australian small businesses adopt AI safely and in understandable stages. It is a service business, not an AI-software platform.

Current public offers:

1. **AI Starter Guide**: a plain-English digital guide. The product page exists; payment is only active if `AI_STARTER_GUIDE_PAYMENT_LINK` is configured.
2. **AI Readiness Pack**: **AUD $495 one-time**. This is the most complete live purchase flow. It scans a public website, takes Stripe payment, sends a private customer form, and collects material for a manually prepared editable delivery pack.
3. **AI Website Review**: offer page and email intake exist. Payment is only active if `AI_REVIEW_PAYMENT_LINK` is configured. The report generation/delivery process is manual.
4. **Secure AI Onboarding**, **AI Voice Receptionist**, **Website + AI Chatbot**, and **AI Business Bundle**: currently lead-generation/enquiry offers, not standalone paid flows.

The homepage is intentionally still a **Coming Soon** landing page while the AI Readiness Pack can be purchased. This is a real conversion/positioning decision for the owner, not a technical accident. Do not replace the homepage with the old development page without explicit approval.

## Live pages and indexability

| Route | Purpose | Indexing |
| --- | --- | --- |
| `/` | Coming Soon landing page and general enquiry form | Indexable |
| `/ai-starter-guide` | Starter Guide product page | Indexable |
| `/supplier-ai-readiness` | AI Readiness Pack product page | Indexable |
| `/ai-readiness-start` | Start Pack form, public scan, then Stripe | `noindex, nofollow` |
| `/ai-readiness-payment-success` | Stripe return page | `noindex, nofollow` |
| `/ai-readiness-details?token=...` | Private buyer form | `noindex, nofollow`; token protected |
| `/ai-website-review` | Website Review product page | Indexable |
| `/review-intake` and `/review-intake-success` | Legacy/manual review intake | `noindex, nofollow` |
| `/contact` and `/contact-success` | General enquiry | Contact is indexable; success is `noindex, nofollow` |
| `/development` | Historic fuller product/pricing preview | Not linked; excluded in `robots.txt`; still directly reachable |

`sitemap.xml` intentionally includes only `/`, Starter Guide, AI Readiness Pack, Website Review, and Contact. Keep transaction, intake, private, success, API, and development routes out of the sitemap.

`robots.txt` excludes `/api/` and `/development`. This is a crawler instruction, **not access control**. The development page remains public if somebody knows the URL. Redirect or remove it only with owner approval.

`llms.txt` is a public factual business summary. It must contain no private links, customer details, or development preview links. It is not a Google ranking tactic.

## Technology and architecture

- Static HTML pages, shared `styles.css`, and vanilla JavaScript.
- Vercel static hosting and Node serverless functions under `api/`.
- Node.js 20+ and npm. No runtime application dependencies.
- Google Fonts: Inter.
- Resend sends customer and internal emails.
- Stripe Checkout takes payments.
- Supabase REST API stores AI Readiness Pack orders.
- No user accounts or admin dashboard currently exist.

### Important source files

| Area | Files | Notes |
| --- | --- | --- |
| Public pages | `index.html`, `ai-starter-guide.html`, `supplier-ai-readiness.html`, `ai-website-review.html`, `contact.html` | Headers/footer are repeated markup, not a template system. |
| Shared UI | `styles.css`, `chatbot.js` | `chatbot.js` implements the simple public chat widget, dynamic accessible mobile menu, and enhancements for the private details form. |
| General contact | `api/contact.js` | POST-only, honeypot, Resend notification to `info@securebusinessai.com.au`, plus customer auto-reply. |
| Readiness start | `ai-readiness-start.html`, `api/ai-readiness-start.js` | Validates/scans the public website, stores draft order, creates Stripe Checkout session. |
| Readiness private workspace | `ai-readiness-details.html`, `api/ai-readiness-order.js` | Token-protected order retrieval, rescan, and business-detail submission. |
| Payments | `api/ai-readiness-checkout.js`, `api/stripe-webhook.js` | The start flow is preferred. The direct checkout endpoint is older and does not create a draft order. |
| Scanner and database client | `api/_lib/ai-readiness.js` | URL safety checks, bounded same-domain crawler, contact/service extraction, Supabase helper. |
| Database schema | `supabase/ai_readiness_orders.sql` | Applies RLS; only service role can use the table. |
| Review flow | `api/review-checkout.js`, `review-intake.html`, `api/review-intake.js`, `docs/templates/ai-website-review-report.md` | Payment-link redirect and email intake only; report delivery is manual. |
| Docs/artefacts | `docs/` | Product briefs, research, templates, and sample Readiness Pack delivery files. |
| Build/validation | `scripts/build-static.js`, `scripts/validate-site.js`, `scripts/test-contact-api.js` | Build copies selected deployable files into `dist/`; keep file lists updated when adding pages/APIs/assets. |

## AI Readiness Pack: actual current workflow

1. Customer opens `/ai-readiness-start` and enters name, email, business name, and website. Bare domains such as `example.com.au` are accepted and normalised to HTTPS.
2. `api/ai-readiness-start.js` validates the public URL, scans the site, creates a `checkout_started` Supabase order, then creates a Stripe Checkout session for the configured $495 Price ID.
3. The page shows a concise summary of public pages checked, services, public phone/email/address clues, and tells the customer the details will be pre-filled after payment.
4. Stripe Checkout is configured to allow promotion codes, collect billing address automatically, create an invoice, and return to `/ai-readiness-payment-success`.
5. Stripe must send `checkout.session.completed` and `checkout.session.async_payment_succeeded` to `/api/stripe-webhook` with the configured signing secret.
6. The webhook verifies Stripe's signature and payment status, creates a 32-byte random access token, stores only its SHA-256 hash in Supabase, sets a 14-day expiry, marks the order paid, and emails the customer an HTML private-workspace link via Resend. It also emails `info@securebusinessai.com.au`.
7. The buyer opens `/ai-readiness-details?token=...`. The page pre-fills identified public contact details, services, and areas. The user can rescan, correct, and add details such as services, service areas, customer questions, and trust points.
8. On saving, `api/ai-readiness-order.js` stores the intake JSON and changes status to `intake_submitted`.
9. Secure Business AI currently prepares the final editable delivery pack manually. The future automation must preserve an internal human approval step before client delivery.

### Scanner boundaries

The scanner is deliberately bounded to public same-domain material:

- only `http`/`https`; rejects credentials in URLs, `localhost`, `.local`, and resolved private/loopback/link-local IPs;
- starts with the supplied home page, then uses same-domain links and sitemap URLs;
- skips login, account, dashboard, admin, checkout, cart, common media/download files, query strings, and fragments;
- scans at most the home page plus 11 additional pages; fetches them in parallel;
- each fetch has a seven-second timeout, does not follow redirects, and only accepts HTML;
- collects title, description, canonical, JSON-LD presence, public email/phone/address clues, service headings/links, service-area clues, and scanned-page list.

The scanner is not a full SEO audit or a general web crawler. Do not expand it into one without reviewing abuse controls, costs, error handling, and legal/privacy implications.

## Environment variables (names only)

Configure in Vercel for the environments that need each feature. Production values were previously entered by the owner; verify scope and values in the Vercel dashboard rather than assuming a Preview value is present.

```env
# Email
RESEND_API_KEY=

# Stripe Payment Links for older flows
AI_REVIEW_PAYMENT_LINK=
AI_STARTER_GUIDE_PAYMENT_LINK=

# Stripe custom Checkout for AI Readiness Pack
STRIPE_SECRET_KEY=
STRIPE_AI_READINESS_PRICE_ID=
STRIPE_WEBHOOK_SECRET=

# Public host used in generated links and Stripe redirect URLs
SITE_URL=https://securebusinessai.com.au

# Supabase REST/service-role access
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

The deployed Readiness Pack uses the Stripe Price ID previously supplied by the owner. Do not place that value in source or documentation even though Stripe Price IDs are less sensitive than secret keys.

### Required external configuration

- **Stripe:** active one-time AI Readiness Pack product/price at AUD $495; promotion codes enabled; invoice creation enabled; webhook endpoint `https://securebusinessai.com.au/api/stripe-webhook` subscribed to the two Checkout events above; webhook signing secret in Vercel.
- **Resend:** `website@securebusinessai.com.au` must be an authorised sender. Internal notifications go to `info@securebusinessai.com.au`.
- **Supabase:** run `supabase/ai_readiness_orders.sql` in the correct project. The service-role key is used only server-side. Do not expose it in browser JavaScript.
- **Vercel:** custom domain `securebusinessai.com.au` points to production. Environment changes need a redeploy before they take effect.

## Local development, checks, and deployment

Install with Node 20 or newer:

```bash
npm install
```

Run before every deployment:

```bash
npm run lint
npm test
npm run build
```

- `npm run lint` checks serverless JavaScript syntax, `chatbot.js`, and static links/required files.
- `npm test` mocks email and does **not** send real messages. It covers the legacy contact/review/readiness-intake endpoints and Checkout redirect shape; it does not fully exercise Stripe webhooks, Supabase, scanning, or the current start-to-webhook workflow.
- `npm run build` recreates `dist/`. It must pass because Vercel invokes it.

For local API work, authenticate/link the Vercel CLI and use:

```bash
npm run dev
```

For static-only viewing, `npm run dev:static` exists, but it does not run API routes. Do not use a local server that exposes `.env*` files to an untrusted network.

Production deploy command, only when owner asks for live release:

```bash
vercel deploy --prod --yes
```

Last verified Codex production deployment was on 17 August 2026. It passed local lint/test/build and was aliased to `https://securebusinessai.com.au`.

## Current production protections

`vercel.json` sets clean URLs and adds:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

There is intentionally no Content Security Policy yet because an incorrect CSP could break Google Fonts or legitimate future integrations. Add one only after auditing all loaded origins.

The mobile menu was added in `chatbot.js` and tested live at a 390px-wide viewport. It uses a button with `aria-expanded`, closes on link click/outside click/Escape, and shares one implementation across every repeated header.

## Current known issues and recommended next work

Prioritise these in small, reviewed changes. Do not silently undertake product, legal, domain, payment, or data-model changes.

### Owner decisions required

1. **Public launch message:** choose whether the homepage remains Coming Soon while a $495 pack is purchasable, or promote the active products publicly. The old `/development` page is not publicised but can still be opened directly.
2. **Legal business information:** obtain approved Privacy Policy, Terms, refund/cancellation position, legal entity/ABN, and contact/address details before publishing legal pages or schema.
3. **Final Readiness Pack delivery:** choose Google Docs, editable DOCX, or another editable format; decide who approves the draft and how the client receives it.
4. **Starter Guide and Website Review sales:** confirm whether their Stripe Payment Links are live and what their prices/success destinations should be.
5. **Automation scope:** decide whether to build an internal order dashboard, Google Docs automation, email sequence, and final delivery system.

### Safe technical/product improvements to assess

- Make the paid product hierarchy and homepage messaging consistent once the owner decides launch status.
- Replace legacy AI Readiness routes (`/ai-readiness-intake*` and direct `/api/ai-readiness-checkout`) only after checking no active Stripe links or customers use them. The supported path is `/ai-readiness-start`.
- Add canonical URL and Open Graph metadata to core public pages, with accurate copy/images.
- Add proportionate abuse protection to public form/scanner endpoints, such as Vercel WAF/rate limits or Turnstile. An in-memory serverless counter is not a reliable production solution.
- Improve webhook/email operational handling: record email send status or make delivery idempotency more robust before retrying failures. Today the webhook only marks an order paid after both emails return successful responses.
- Review scanner DNS-rebinding resilience and edge cases if the scanner becomes a larger/high-volume product.
- Build a minimal internal delivery queue from Supabase records before attempting automatic client delivery.
- Add tests for `api/ai-readiness-start.js`, `api/ai-readiness-order.js`, the scanner safety helpers, and Stripe webhook signature/idempotency behaviour using mocks.

### Do not do without a specific request

- Do not make a live payment, refund, coupon, or Stripe configuration change.
- Do not invoke Stripe webhooks, send live customer email, or access a private token URL merely to test it.
- Do not query or modify real Supabase customer records/schema.
- Do not expose, rotate, or copy credentials.
- Do not add `development`, private, transaction, or API routes to sitemap/`llms.txt`.
- Do not claim that an `llms.txt` file guarantees AI discovery or Google ranking.

## Historical and superseded files

These files are retained but do not fully describe the current implementation:

- `CODEX_HANDOFF.md`: includes the original VPS import history and claims that now conflict with the local project state. Treat as archival only.
- `README.md`: broadly useful for local commands but says the webhook/database are a future stage. That is outdated.
- `docs/AI_READINESS_PACK_PROCESS.md`: describes an earlier payment-link to intake-email flow. The current primary flow is private token workspace plus Supabase/Stripe webhook as documented above.
- `docs/AI_WEBSITE_REVIEW_PROCESS.md`: remains useful for manual report delivery and plain-language report rules. Its listed product names/prices and future roadmap require owner confirmation.
- `CLAUDE_CODE_REVIEW_HANDOFF.md`: was a review-only brief. A previous Claude review has already produced recommendations, several of which were implemented on 17 August 2026: mobile menu, clickable cards, consistent enquiry names, removal of development references from public pages/`llms.txt`, crawler exclusions, transaction page `noindex`, and conservative response headers.

## Suggested first task for Claude

1. Read this handoff, `package.json`, `scripts/validate-site.js`, the active Readiness APIs, and the current production pages.
2. Run `npm run lint`, `npm test`, and `npm run build` locally.
3. Compare source to the live core public routes without touching private-token links or paid checkout.
4. Present a short prioritised plan to the owner. Clearly separate owner decisions from code-only changes.
5. Make only approved, scoped changes; verify locally; deploy only with owner approval; then re-check the public live result.

