-- Handover Code + Sealed Receipt.
-- The 4-digit handover code lives in its own table with RLS on and no policies, so only the
-- server (service role) can read it. Deal participants can read `deals` directly, so the code
-- must never be stored there.

alter table public.deals
  add column if not exists handover_verified_at timestamptz,
  add column if not exists sealed_at timestamptz,
  add column if not exists receipt_hash text;

create table if not exists public.deal_secrets (
  deal_id uuid primary key references public.deals (id) on delete cascade,
  handover_code text not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.deal_secrets enable row level security;
revoke all on public.deal_secrets from anon, authenticated;
