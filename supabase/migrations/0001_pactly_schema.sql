-- Pactly schema: campuses, profiles, posts, deals, ride bookings, reviews, reports, blocks.
-- Idempotent-ish: safe to run on a fresh project. Row-level security is enabled on every table.

create extension if not exists pgcrypto;

-- ───────────────────────── Campuses ─────────────────────────
create table if not exists public.campuses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city text not null,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Profiles (public part of a user) ─────────────────────────
do $$ begin
  create type verification_status as enum ('unsubmitted', 'pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  campus_id uuid references public.campuses (id),
  department text,
  year smallint check (year between 1 and 6),
  bio text,
  skills text[] not null default '{}',
  verification_status verification_status not null default 'unsubmitted',
  role text not null default 'user' check (role in ('user', 'admin')),
  trust_score smallint not null default 0,
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  completed_deals integer not null default 0,
  invite_code text unique not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  invited_by uuid references public.profiles (id),
  -- Nexconn user id: the profile uuid without dashes (alphanumeric, non-sequential)
  nexconn_user_id text unique generated always as (replace(id::text, '-', '')) stored,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Private part of a user: UPI ID and ID card path. Never readable by other users;
-- the server reveals UPI only to a counterpart once a deal is Agreed.
create table if not exists public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  upi_id text,
  id_card_path text,
  id_submitted_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ───────────────────────── Posts ─────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  campus_id uuid not null references public.campuses (id),
  type text not null check (type in ('task', 'market', 'ride')),
  title text not null check (char_length(title) between 3 and 90),
  description text not null default '',
  category text not null default 'Other',
  price integer not null check (price >= 0),           -- reward / price / daily rate / fuel share per seat (₹)
  location text,
  images text[] not null default '{}',
  details jsonb not null default '{}'::jsonb,           -- type-specific fields (see README)
  status text not null default 'open' check (status in ('open', 'in_deal', 'closed', 'completed')),
  created_at timestamptz not null default now()
);
create index if not exists posts_feed_idx on public.posts (status, created_at desc);
create index if not exists posts_campus_idx on public.posts (campus_id, created_at desc);

-- ───────────────────────── Deals ─────────────────────────
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id),   -- the person who tapped Accept / Buy / Book
  seller_id uuid not null references public.profiles (id),  -- the post author
  price integer not null check (price >= 0),
  original_price integer not null,
  status text not null default 'offer'
    check (status in ('offer', 'counter', 'agreed', 'in_progress', 'done', 'reviewed', 'cancelled')),
  last_actor_id uuid references public.profiles (id),
  buyer_done boolean not null default false,
  seller_done boolean not null default false,
  nexconn_conversation_id text,   -- "direct:<buyerNexconnId>:<sellerNexconnId>"
  nexconn_message_id text,        -- the DealCard message whose metadata is updated in place
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
create index if not exists deals_buyer_idx on public.deals (buyer_id, updated_at desc);
create index if not exists deals_seller_idx on public.deals (seller_id, updated_at desc);
-- One live deal per buyer per post
create unique index if not exists deals_one_active
  on public.deals (post_id, buyer_id) where status not in ('cancelled', 'reviewed', 'done');

-- ───────────────────────── Rides ─────────────────────────
create table if not exists public.ride_bookings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  passenger_id uuid not null references public.profiles (id),
  seats smallint not null default 1 check (seats between 1 and 6),
  fare integer not null,
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (post_id, passenger_id)
);

-- ───────────────────────── Reviews ─────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id),
  reviewee_id uuid not null references public.profiles (id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (deal_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);

-- ───────────────────────── Safety ─────────────────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id),
  reported_user_id uuid references public.profiles (id),
  reason text not null check (reason in ('harassment', 'scam', 'safety', 'inappropriate', 'other')),
  note text,
  message_id text,
  channel_key text,
  evidence jsonb not null default '[]'::jsonb,  -- up to 10 messages before + the message + 10 after
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Server-side Scam Guard hits (written by the server, read by admins)
create table if not exists public.scam_flags (
  id uuid primary key default gen_random_uuid(),
  message_id text,
  sender_id uuid references public.profiles (id),
  rule_ids text[] not null,
  excerpt text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Helpers ─────────────────────────
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Trust score = verified 40 + profile complete 20 + completed deals 20 + rating 10 + campus invites 10
create or replace function public.recompute_trust(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles;
  completeness numeric;
  invites int;
  score numeric;
begin
  select * into p from public.profiles where id = uid;
  if not found then return; end if;
  completeness := (
    (case when coalesce(p.full_name, '') <> '' then 1 else 0 end) +
    (case when p.avatar_url is not null then 1 else 0 end) +
    (case when coalesce(p.department, '') <> '' and p.year is not null then 1 else 0 end) +
    (case when coalesce(array_length(p.skills, 1), 0) > 0 then 1 else 0 end) +
    (case when coalesce(p.bio, '') <> '' then 1 else 0 end)
  ) / 5.0;
  select count(*) into invites from public.profiles where invited_by = uid and verification_status = 'verified';
  score :=
    (case when p.verification_status = 'verified' then 40 else 0 end)
    + 20 * completeness
    + 20 * least(p.completed_deals, 5) / 5.0
    + (case when p.rating_count > 0 then 10 * p.rating_avg / 5.0 else 0 end)
    + 10 * least(invites, 3) / 3.0;
  update public.profiles set trust_score = round(score) where id = uid and trust_score <> round(score);
end $$;

create or replace function public.profiles_trust_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.recompute_trust(new.id);
  if new.invited_by is not null then perform public.recompute_trust(new.invited_by); end if;
  return null;
end $$;

drop trigger if exists profiles_trust on public.profiles;
create trigger profiles_trust after insert or update of
  full_name, avatar_url, department, year, skills, bio, verification_status, completed_deals, rating_avg, invited_by
  on public.profiles for each row execute function public.profiles_trust_trigger();

create or replace function public.reviews_rollup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles p set
    rating_avg = coalesce((select avg(rating) from public.reviews where reviewee_id = new.reviewee_id), 0),
    rating_count = (select count(*) from public.reviews where reviewee_id = new.reviewee_id)
  where p.id = new.reviewee_id;
  return null;
end $$;

drop trigger if exists reviews_rollup on public.reviews;
create trigger reviews_rollup after insert on public.reviews for each row execute function public.reviews_rollup();

-- Create a profile row automatically for each new auth user
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
          new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  insert into public.profile_private (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ───────────────────────── Row-level security ─────────────────────────
alter table public.campuses enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.posts enable row level security;
alter table public.deals enable row level security;
alter table public.ride_bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.scam_flags enable row level security;

-- campuses: public read
drop policy if exists campuses_read on public.campuses;
create policy campuses_read on public.campuses for select using (true);

-- profiles: any signed-in user can read public profiles; users edit only safe columns of their own row
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Lock privileged columns: users may only update these columns directly.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, avatar_url, campus_id, department, year, bio, skills, onboarded) on public.profiles to authenticated;

-- profile_private: owner only (admins go through the server with the service role)
drop policy if exists private_self on public.profile_private;
create policy private_self on public.profile_private for select to authenticated using (user_id = auth.uid());
drop policy if exists private_update_self on public.profile_private;
create policy private_update_self on public.profile_private for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.profile_private from authenticated, anon;
grant update (upi_id) on public.profile_private to authenticated;

-- posts: signed-in users read all; verified users create their own; authors update/delete their own
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated using (true);
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert to authenticated with check (
  author_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and verification_status = 'verified')
);
drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts for update to authenticated using (author_id = auth.uid());
drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts for delete to authenticated using (author_id = auth.uid());

-- deals: participants read; all writes go through server routes (service role) to enforce the state machine
drop policy if exists deals_read on public.deals;
create policy deals_read on public.deals for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

-- ride bookings: the driver and every passenger of that ride can read the manifest
create or replace function public.is_ride_member(p_post uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts where id = p_post and author_id = auth.uid())
      or exists (select 1 from public.ride_bookings where post_id = p_post and passenger_id = auth.uid() and status = 'booked');
$$;
drop policy if exists rides_read on public.ride_bookings;
create policy rides_read on public.ride_bookings for select to authenticated
  using (passenger_id = auth.uid() or public.is_ride_member(post_id) or public.is_admin());

-- reviews: public read (shown on profiles); inserts via server
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select to authenticated using (true);

-- reports: reporter reads own, admins read all; inserts via server
drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

-- blocks: users manage their own block list
drop policy if exists blocks_own on public.blocks;
create policy blocks_own on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- scam flags: admins only
drop policy if exists scam_flags_admin on public.scam_flags;
create policy scam_flags_admin on public.scam_flags for select to authenticated using (public.is_admin());

-- ───────────────────────── Storage ─────────────────────────
insert into storage.buckets (id, name, public) values ('id-cards', 'id-cards', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

-- id-cards: owners may upload into their own folder; nobody but the service role can read
drop policy if exists "id cards upload own" on storage.objects;
create policy "id cards upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'id-cards' and (storage.foldername(name))[1] = auth.uid()::text);

-- public images: owners write in their own folder; anyone can read (bucket is public)
drop policy if exists "public images upload own" on storage.objects;
create policy "public images upload own" on storage.objects for insert to authenticated
  with check (bucket_id in ('post-images', 'avatars') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "public images update own" on storage.objects;
create policy "public images update own" on storage.objects for update to authenticated
  using (bucket_id in ('post-images', 'avatars') and (storage.foldername(name))[1] = auth.uid()::text);
