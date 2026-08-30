-- ============================================================
-- Deckmate — schema and privacy model
-- Run this FIRST in the Supabase SQL editor, then 02_seed.sql.
-- Re-runnable: drops and recreates everything it owns.
-- ============================================================

-- ---------- reset ----------
drop function if exists public.get_team_contacts(uuid);
drop function if exists public.get_my_profile();
drop table if exists public.ratings cascade;
drop table if exists public.applications cascade;
drop table if exists public.requests cascade;
drop table if exists public.users cascade;
drop type if exists user_role cascade;
drop type if exists work_style cascade;
drop type if exists comp_type cascade;
drop type if exists request_status cascade;
drop type if exists application_status cascade;

create extension if not exists pgcrypto with schema extensions;

-- ---------- enums ----------
create type user_role          as enum ('structurer','analyst','storyteller','financial_planner');
create type work_style         as enum ('early_riser','night_owl','flexible');
create type comp_type          as enum ('strategy_growth','marketing_brand','finance','operations');
create type request_status     as enum ('open','filled','closed','expired');
create type application_status as enum ('pending','accepted','declined');

-- ---------- four tables, and no more ----------
create table public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  name                text not null,
  year                int  not null,
  section             text,
  role                user_role  not null,
  work_style          work_style not null default 'flexible',
  skills              text[]     not null default '{}',
  credibility_line    text,
  contact_handle      text not null,   -- never selectable through the table
  avatar_url          text,
  reliability_score   numeric,         -- cached; derived from ratings
  ratings_given_count int  not null default 0,
  created_at          timestamptz not null default now()
);

create table public.requests (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.users(id) on delete cascade,
  comp_name     text not null,
  comp_type     comp_type not null,
  skills_needed text[] not null default '{}',
  roles_needed  user_role[] not null default '{}',
  team_size     int not null check (team_size between 2 and 4),
  deadline      timestamptz not null,
  status        request_status not null default 'open',
  created_at    timestamptz not null default now()
);

create table public.applications (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.requests(id) on delete cascade,
  applicant_id uuid not null references public.users(id) on delete cascade,
  status       application_status not null default 'pending',
  created_at   timestamptz not null default now(),
  unique (request_id, applicant_id)
);

create table public.ratings (
  id               uuid primary key default gen_random_uuid(),
  request_id       uuid not null references public.requests(id) on delete cascade,
  rater_id         uuid not null references public.users(id) on delete cascade,
  rated_id         uuid not null references public.users(id) on delete cascade,
  would_team_again boolean not null,
  created_at       timestamptz not null default now(),
  unique (request_id, rater_id, rated_id),
  check (rater_id <> rated_id)
);

create index on public.requests (status, deadline);
create index on public.applications (request_id);
create index on public.applications (applicant_id);

-- ---------- L3: an enum constrains values, not direction ----------
create or replace function public.enforce_application_transition()
returns trigger language plpgsql as $fn$
begin
  if old.status <> 'pending' and new.status is distinct from old.status then
    raise exception 'application % is terminal (%); cannot become %',
      old.id, old.status, new.status;
  end if;
  return new;
end $fn$;

create trigger applications_transition
  before update on public.applications
  for each row execute function public.enforce_application_transition();

-- ---------- Phase 8 engine: a rating moves both scores ----------
create or replace function public.apply_rating()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $fn$
begin
  update public.users u
     set reliability_score = (
       select round(100.0 * count(*) filter (where r.would_team_again) / count(*))
         from public.ratings r where r.rated_id = new.rated_id
     )
   where u.id = new.rated_id;

  update public.users u
     set ratings_given_count = (
       select count(*) from public.ratings r where r.rater_id = new.rater_id
     )
   where u.id = new.rater_id;

  return new;
end $fn$;

create trigger ratings_apply
  after insert on public.ratings
  for each row execute function public.apply_rating();

-- ============================================================
-- PRIVACY MODEL
--   L1: a column-scoped GRANT only adds privileges. Revoke first.
--   L5: enforce by the shape of the return type, not by a filter.
-- ============================================================
revoke all on public.users        from anon, authenticated;
revoke all on public.requests     from anon, authenticated;
revoke all on public.applications from anon, authenticated;
revoke all on public.ratings      from anon, authenticated;

-- contact_handle and email are absent from this list. They are therefore
-- unreachable through the table by any client, under any filter, forever.
grant select (id, name, year, section, role, work_style, skills,
              credibility_line, avatar_url, reliability_score,
              ratings_given_count, created_at)
  on public.users to authenticated;

grant insert (id, email, name, year, section, role, work_style, skills,
              credibility_line, contact_handle, avatar_url)
  on public.users to authenticated;

grant update (name, year, section, role, work_style, skills,
              credibility_line, contact_handle, avatar_url)
  on public.users to authenticated;

grant select, insert, update on public.requests     to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select, insert         on public.ratings      to authenticated;

alter table public.users        enable row level security;
alter table public.requests     enable row level security;
alter table public.applications enable row level security;
alter table public.ratings      enable row level security;

create policy users_read_all   on public.users for select to authenticated using (true);
create policy users_insert_own on public.users for insert to authenticated with check (auth.uid() = id);
create policy users_update_own on public.users for update to authenticated using (auth.uid() = id);

create policy req_read_all   on public.requests for select to authenticated using (true);
create policy req_insert_own on public.requests for insert to authenticated with check (auth.uid() = author_id);
create policy req_update_own on public.requests for update to authenticated using (auth.uid() = author_id);

-- an applicant sees their own applications; an author sees applications to their requests
create policy app_read on public.applications for select to authenticated
  using (applicant_id = auth.uid()
      or exists (select 1 from public.requests r
                  where r.id = request_id and r.author_id = auth.uid()));

create policy app_insert_own on public.applications for insert to authenticated
  with check (applicant_id = auth.uid()
          and not exists (select 1 from public.requests r
                           where r.id = request_id and r.author_id = auth.uid()));

-- only the request author may accept or decline
create policy app_update_author on public.applications for update to authenticated
  using (exists (select 1 from public.requests r
                  where r.id = request_id and r.author_id = auth.uid()));

create policy rat_read   on public.ratings for select to authenticated
  using (rater_id = auth.uid() or rated_id = auth.uid());
create policy rat_insert on public.ratings for insert to authenticated
  with check (rater_id = auth.uid());

-- ---------- the only door to a contact handle ----------
-- Drives FROM applications, so the join key comes from the grant itself.
-- Every line here narrows the result. No deletion widens it.
create or replace function public.get_team_contacts(p_request_id uuid)
returns table (user_id uuid, name text, contact_handle text)
language sql security definer set search_path = public, pg_temp as $fn$
  -- the author sees accepted applicants
  select u.id, u.name, u.contact_handle
    from public.applications a
    join public.requests r on r.id = a.request_id
    join public.users    u on u.id = a.applicant_id
   where a.request_id = p_request_id
     and a.status = 'accepted'
     and r.author_id = auth.uid()
  union
  -- an accepted applicant sees the author
  select u.id, u.name, u.contact_handle
    from public.applications a
    join public.requests r on r.id = a.request_id
    join public.users    u on u.id = r.author_id
   where a.request_id = p_request_id
     and a.status = 'accepted'
     and a.applicant_id = auth.uid()
  union
  -- accepted applicants see each other
  select u.id, u.name, u.contact_handle
    from public.applications me
    join public.applications a on a.request_id = me.request_id
    join public.users        u on u.id = a.applicant_id
   where me.request_id   = p_request_id
     and me.applicant_id = auth.uid()
     and me.status = 'accepted'
     and a.status  = 'accepted'
     and a.applicant_id <> auth.uid();
$fn$;

-- your own row, contact handle included
create or replace function public.get_my_profile()
returns setof public.users
language sql security definer set search_path = public, pg_temp as $fn$
  select * from public.users where id = auth.uid();
$fn$;

revoke all on function public.get_team_contacts(uuid) from anon, public;
revoke all on function public.get_my_profile()        from anon, public;
grant execute on function public.get_team_contacts(uuid) to authenticated;
grant execute on function public.get_my_profile()        to authenticated;
