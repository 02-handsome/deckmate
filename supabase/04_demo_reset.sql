-- ============================================================
-- Deckmate — reset to a known demo state
--
-- Run this immediately before recording, and again between takes.
-- Idempotent: running it twice does the same thing as running it once.
--
-- Why it exists: the seed sets deadlines as `now() + interval`, so they
-- count down in real time. A week after seeding, "3 days left" has become
-- "expired" and the request has dropped out of the feed entirely —
-- expiry-on-read is doing exactly what it should, and it would take your
-- demo with it. This puts the clock back.
-- ============================================================

-- ---------- 1. remove anything created while testing ----------
-- Scoped to named rows. Deleting the auth user cascades their profile,
-- their requests, and any applications either way (L9: never a bare delete).
delete from auth.users
 where id in (
   select id from public.users
    where name in ('Alex', 'Test_User1', 'Test Account')
 );

delete from public.requests
 where comp_name in ('test_user_case_comp');

-- ---------- 2. put the clock back ----------
-- Restores the spread the seed intended, relative to right now.
update public.requests set deadline = now() + interval '3 days',  status = 'open'
 where comp_name = 'ITC Interrobang';
update public.requests set deadline = now() + interval '6 days',  status = 'open'
 where comp_name = 'HUL L.I.M.E. Season 12';
update public.requests set deadline = now() + interval '9 days',  status = 'open'
 where comp_name = 'Flipkart Wired 6.0';
update public.requests set deadline = now() + interval '12 days', status = 'open'
 where comp_name = 'McKinsey Case Challenge 2026';
update public.requests set deadline = now() + interval '19 days', status = 'open'
 where comp_name = 'Bain Business Bowl';
update public.requests set deadline = now() + interval '25 days', status = 'open'
 where comp_name = 'Tata Crucible Campus';

-- These two MUST stay in the past. The rating nudge only appears for a
-- competition whose deadline has gone, so Phase 8 depends on it.
update public.requests set deadline = now() - interval '5 days',  status = 'filled'
 where comp_name = 'Deloitte Maverick 2025';
update public.requests set deadline = now() - interval '21 days', status = 'filled'
 where comp_name = 'Nestle 4Front 2025';

-- ---------- 3. clear the applications the demo creates ----------
-- So the apply -> accept -> reveal beat is fresh. Deleted rather than set
-- back to 'pending', because the transition trigger makes 'accepted'
-- terminal — which is the behaviour the demo is showing off.
delete from public.applications
 where applicant_id = (select id from public.users where name = 'Yash Agarwal')
   and request_id in (
     select id from public.requests
      where comp_name in ('ITC Interrobang', 'Bain Business Bowl',
                          'Tata Crucible Campus')
   );

-- Bain picked up an accepted applicant during testing, which spoils it as
-- a backup: a populated contact panel before you click Accept kills the
-- reveal. Put it back to pending.
delete from public.applications
 where status = 'accepted'
   and request_id = (select id from public.requests where comp_name = 'Bain Business Bowl');

-- ---------- 4. re-lock Sneha's reliability score ----------
delete from public.ratings
 where rater_id = (select id from public.users where name = 'Sneha Pillai');

-- The recompute trigger fires on INSERT only, so deleting ratings leaves
-- both cached columns stale. Recompute the lot — cheap at this size, and
-- it cannot drift.
update public.users u
   set reliability_score = (
     select round(100.0 * count(*) filter (where r.would_team_again)
                  / nullif(count(*), 0))
       from public.ratings r where r.rated_id = u.id
   ),
   ratings_given_count = (
     select count(*) from public.ratings r where r.rater_id = u.id
   );

-- ---------- 5. confirm the demo state ----------
select
  (select count(*) from public.users)                                    as users,
  (select count(*) from public.requests where status = 'open')           as open_requests,
  (select count(*) from public.requests where deadline < now())          as past_competitions,
  (select ratings_given_count from public.users where name = 'Sneha Pillai')
                                                                         as sneha_has_rated,
  (select count(*) from public.applications a
     join public.requests r on r.id = a.request_id
    where r.comp_name = 'ITC Interrobang' and a.status = 'accepted')     as itc_accepted;
-- Expect: 31 | 6 | 2 | 0 | 0
--   31 users .............. 30 seeded students + your own account
--   6 open ................ nothing expired
--   2 past ................ the two finished competitions Phase 8 needs
--   sneha_has_rated 0 ..... her score is locked again
--   itc_accepted 0 ........ the reveal will appear from nothing
