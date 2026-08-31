# DeckMate

Team matching for business-school case competitions. Students post the
gap on their team; the feed ranks open requests against the viewer's role
and skills; contact details are exchanged only after an application is
accepted; and a reliability score you can only see by rating your past
teammates gives people a reason to come back.

**Live:** _add your Vercel URL here after deploying_

---

## Try it in two minutes

Sign up with any email — no campus domain restriction, so you can use
your own address. Or sign in as a seeded student to land in a populated
app straight away:

| Email | Password | What you'll see |
|---|---|---|
| `sara.chen@micamail.in` | `deckmate123` | An Analyst's ranked feed, plus two teammates waiting to be rated |
| `arjun.desai@micamail.in` | `deckmate123` | A Structurer with three applicants to accept or decline |
| `aarav.mehta@micamail.in` | `deckmate123` | The author of the McKinsey request |

### The five-minute demo

1. **Sign in as Sara.** The feed is ranked, and each card says *why* —
   "Needs your role", "1 of 2 skills", "Closing soon".
2. **Open any request and apply.** Note what the author will see: your
   role, skills and score, explicitly *not* your contact handle.
3. **Sign out, sign in as that request's author.** You see the applicant
   with no way to contact them.
4. **Accept.** Both handles appear, on both sides, immediately.
5. **Sign in as Sara and open Profile.** Her reliability score is
   *locked* until she rates the teammates from her last competition. Tap
   through and it unlocks.

Step 5 is the point of the product. Steps 2–4 are the promise it makes.

---

## Architecture

Next.js (App Router) + Supabase (Postgres + Auth) + Tailwind, on Vercel.

### Four tables

```
users         id, name, year, section, role, work_style, skills[],
              credibility_line, contact_handle, avatar_url,
              reliability_score, ratings_given_count

requests      author_id, comp_name, comp_type, skills_needed[],
              roles_needed[], team_size, deadline, status

applications  request_id, applicant_id, status
ratings       request_id, rater_id, rated_id, would_team_again
```

`reliability_score` is a cached derivation of `ratings`, recomputed by a
trigger. `ratings_given_count` is what gates visibility of your own
score — it has to exist in the schema from day one, because it is the
retention mechanism.

### Contact privacy, enforced three times

This is the core promise, so it does not rest on any single control:

1. **Column grant.** `contact_handle` and `email` are absent from the
   `GRANT SELECT` on `public.users`. Postgres refuses them to every
   client, under every filter. Every grant is preceded by a `REVOKE`,
   because a column-scoped grant can only widen a table-wide one.
2. **Return type.** `PublicUser` in `lib/types.ts` has no
   `contact_handle` field, so a component that tries to render one does
   not compile.
3. **One door.** `get_team_contacts()` is `SECURITY DEFINER` and drives
   **FROM `applications` WHERE status = 'accepted'**, so the join key
   comes from the grant itself. Deleting any line of it narrows the
   result; no deletion widens it.

### Feed ranking

Role complementarity 40, skill overlap 30, work-style fit 15, deadline
proximity 15. Role fit is weighted highest because a balanced team is
what the product exists to produce — a fourth Analyst adds less than a
first Storyteller. Deadline proximity is deliberately smallest, so
urgency breaks ties between good matches rather than promoting bad ones.
Reasoning is in `lib/ranking.ts`, next to the code.

### Expiry on read, not cron

`listOpenRequests()` filters `status = 'open' AND deadline > now()`.
There is no scheduled job correcting the status column.

---

## Running it locally

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

In the Supabase SQL editor, run `supabase/01_schema.sql` then
`supabase/02_seed.sql`. Turn **off** email confirmation under
Authentication → Sign In / Providers. Then:

```bash
npm run dev
```

## Verifying the privacy model

```bash
node scripts/verify-privacy.mjs
```

Signs in as a student with no connection to a team and *attempts* the
forbidden reads rather than asserting they would fail. It counts rows
rather than checking for an error, because a blocked policy and a broken
one both return zero rows. It also confirms a real team member still
gets contacts, so a passing result cannot be vacuous.

```
PASS  select contact_handle is refused
PASS  get_team_contacts returns zero rows
PASS  select * is refused by the column grant
PASS  an accepted member DOES get contacts (proves the test isn't vacuous)
PASS  declined -> accepted is refused by the trigger
```

---

## Not built

In-app chat. Photo uploads. Push or email notifications. Multi-campus.
Native apps. Free-text search. Team formation with a designated
decision-maker. Editing or closing a request after posting. The
long-form post-competition feedback form.

Design decisions, tradeoffs, and known gaps are recorded in
[`docs/notes.md`](docs/notes.md).
