-- Page content store for the Secure Business AI content admin (CMS).
-- Holds editable text overrides per page/section. Default copy stays baked into
-- the static HTML for SEO and first paint; rows here override it when present.
--
-- Security model (matches ai_readiness_orders): RLS is enabled with NO policies,
-- so only the service role (used server-side in the serverless API) can read or
-- write. The browser never talks to this table directly.

create table if not exists public.page_content (
  page          text        not null,          -- e.g. 'index', 'ai-readiness-pack'
  section_key   text        not null,          -- e.g. 'hero.title', 'hero.copy'
  content       text        not null default '',
  updated_at    timestamptz not null default now(),
  updated_by    text,                          -- admin identifier / label
  primary key (page, section_key)
);

alter table public.page_content enable row level security;

-- Intentionally no RLS policies: the anon/public role has no access.
-- All reads and writes go through server-side functions using the service role,
-- which bypasses RLS. Do not add a public SELECT policy unless the content
-- delivery model changes to direct client reads.

-- Keep updated_at fresh on every write.
create or replace function public.page_content_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists page_content_set_updated_at on public.page_content;
create trigger page_content_set_updated_at
  before update on public.page_content
  for each row execute function public.page_content_touch_updated_at();
