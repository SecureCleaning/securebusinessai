-- Paid AI Starter Guide checkouts.
-- One row per paid Stripe Checkout Session for the $47 AI Starter Guide.
-- Purpose: make the PDF email delivery idempotent (Stripe can retry the
-- checkout.session.completed webhook) and keep a simple sales record.
--
-- Security model (matches ai_readiness_orders / page_content): RLS is enabled
-- with NO policies, so anon/auth clients get nothing. Only the server webhook,
-- using the Supabase service role, can read or write these rows.

create table if not exists public.starter_guide_orders (
  stripe_session_id text primary key,
  customer_email text,
  customer_name text,
  amount_total integer,
  currency text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.starter_guide_orders enable row level security;

comment on table public.starter_guide_orders is
  'One row per paid AI Starter Guide checkout. Used to make PDF email delivery idempotent (Stripe may retry the webhook) and to keep a simple sales record. RLS on with no policies: only the service role (server webhook) can read/write.';
