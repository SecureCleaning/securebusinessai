# AI Starter Guide — automated delivery plan

Goal: when a customer buys the AI Starter Guide ($47 Payment Link), they automatically
receive the PDF, with no manual step. Reuses the patterns already proven by the AI
Readiness Pack (Stripe webhook → Supabase → Resend).

## Current state

- Live Stripe product **AI Starter Guide** (`prod_V700PSdsVyxEYu`), price `price_1U6m05RuF0Oc4WfgtQfgw7Z5`, $47 AUD.
- Payment Link `https://buy.stripe.com/dRm4gBboI2xM9Qubh287K00`, wired to the site via `AI_STARTER_GUIDE_PAYMENT_LINK`.
- After payment the customer sees Stripe's hosted confirmation. **No PDF is sent.**
- The guide content exists only as a draft (`docs/AI_Starter_Guide_Draft.docx`).

## Prerequisites (owner)

1. **Finalise the PDF.** Approve the guide copy (see the earlier review), then produce the
   designed PDF. Keep the file name unguessable (e.g. `ai-starter-guide-v1-8f3c.pdf`).
2. Decide delivery style: **signed download link** (recommended — small emails, revocable,
   expiring) vs. **email attachment** (simplest, but heavier and less controllable).

## Recommended build (smallest sensible version)

1. **Store the PDF privately.** Upload to a **Supabase Storage** private bucket (e.g. `guides`)
   in the Secure Business AI project. Server code mints a short‑lived signed URL per purchase.
2. **Handle the purchase in the existing webhook** (`api/stripe-webhook.js`). Payment‑Link
   completions already fire `checkout.session.completed` to `/api/stripe-webhook` with the
   same signing secret, so no new endpoint or Stripe config is needed. Extend it to:
   - Retrieve the session's line items (it already has `STRIPE_SECRET_KEY`).
   - If a line item's price is the **guide price ID**, treat it as a guide order.
   - Generate a signed URL (7‑day expiry) for the PDF via the Supabase service role.
   - Email it from `website@securebusinessai.com.au` via Resend (sender already verified),
     with the download link and a short "how to use it" note.
3. **Idempotency.** Add a tiny `guide_deliveries` table (`stripe_session_id` primary key,
   `email`, `sent_at`) — RLS on, service‑role only, exactly like `ai_readiness_orders`. Skip
   sending if the session id is already recorded. This prevents duplicate emails on Stripe
   retries.
4. **Test before live.** Create a test‑mode product/price/Payment Link, point a Preview
   deployment's env at test keys, buy with a Stripe test card, and confirm one email arrives
   with a working, expiring link. Only then rely on it in production.

## Effort / sequencing

- Small, self‑contained: ~one webhook extension + one Supabase table + one Storage bucket.
- No change to the public site or the Payment Link is required; it's all server‑side.
- Blocked only on the **finalised PDF** — everything else can be built and tested with a
  placeholder PDF first.

## Alternative (fastest, weaker)

Host the PDF at a public, unguessable URL and set the Payment Link's `after_completion` to
redirect there. Zero backend, but the link can be shared and re‑downloaded freely, and there's
no email record. Fine as a stopgap; the signed‑link version above is the durable answer.

## Note on the guide itself

Until the PDF is finalised and this delivery is built and tested, consider softening the
"Buy the Guide – $47" button to a wait‑list/"notify me" so customers aren't charged for a
product that is delivered by hand.
