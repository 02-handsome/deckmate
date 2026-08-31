-- ============================================================
-- Deckmate — contact handle format
--
-- A contact_handle must be either an @handle or exactly 10 digits.
-- Run this AFTER 01_schema.sql and 02_seed.sql. Safe to re-run.
--
-- The app validates this too, in lib/contact.ts. That validation is for
-- the error message. THIS is the enforcement — TypeScript is not a
-- security boundary and the publishable key is public, so anyone can
-- POST straight past the form.
-- ============================================================

-- ---------- who currently violates the rule? ----------
-- Run this first. It counts without revealing any handle, so it does not
-- widen what the privacy model exposes.
select count(*) as violating_rows
  from public.users
 where not (
   contact_handle ~ '^@[A-Za-z0-9._]{2,30}$'
   or contact_handle ~ '^[0-9]{10}$'
 );
-- All 30 seeded students use @handles and pass. A row you created by hand
-- while testing may not.

-- ---------- the constraint ----------
alter table public.users
  drop constraint if exists users_contact_handle_format;

alter table public.users
  add constraint users_contact_handle_format
  check (
    contact_handle ~ '^@[A-Za-z0-9._]{2,30}$'
    or contact_handle ~ '^[0-9]{10}$'
  )
  not valid;

/*
  Why NOT VALID.

  A validated constraint is checked against every existing row when it is
  added, and fails the whole statement if any row breaks it. Contact
  handles are deliberately unreadable from outside the database — that is
  the entire point of the column grant — so neither the app nor I can
  audit them before running this.

  NOT VALID skips the one-time check on existing rows but enforces the
  rule on every INSERT and UPDATE from this moment on, which is the
  actual requirement. It is a standard Postgres pattern for adding a
  constraint to a live table, not a loophole.

  Once violating_rows above reads 0, promote it to fully validated:

      alter table public.users
        validate constraint users_contact_handle_format;
*/

-- ---------- confirm it is attached ----------
select conname, convalidated
  from pg_constraint
 where conrelid = 'public.users'::regclass
   and conname = 'users_contact_handle_format';
