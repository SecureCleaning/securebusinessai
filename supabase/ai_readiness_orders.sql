create table if not exists public.ai_readiness_orders (
  id uuid primary key,
  stripe_session_id text unique,
  customer_email text not null,
  customer_name text not null,
  business_name text not null,
  website_url text not null,
  status text not null check (status in ('checkout_started', 'paid', 'intake_submitted', 'draft_ready', 'delivered')),
  access_token_hash text not null,
  access_expires_at timestamptz not null,
  site_scan jsonb not null default '{}'::jsonb,
  intake jsonb not null default '{}'::jsonb,
  access_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_readiness_orders enable row level security;
revoke all on public.ai_readiness_orders from anon, authenticated;
grant select, insert, update, delete on public.ai_readiness_orders to service_role;
