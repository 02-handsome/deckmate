# Deckmate — build notes

The project's memory. Decisions, tradeoffs, and the things that must not
be relearned.

---

## Carried-over lessons (from Find Your People)

**L1 — A control that looks like enforcement may be a silent no-op.**
A column-scoped GRANT can only add privileges, never narrow a
table-wide grant Supabase already gave. Postgres raises no error.
ALWAYS revoke before granting.

**L2 — For every "user X must not be able to do Y", write the test
that attempts Y.** Reading the code found nothing; attempting the
forbidden operation found a live privilege escalation.

**L3 — An enum constrains values, not direction.** A status field
needs transition triggers, or terminal states aren't terminal.
`declined -> accepted` would revive a refusal the sender was never
told about.

**L4 — RLS blocks produce zero rows, not errors.** A security test
that only checks for an error reports a working policy and a
successful write identically. Count affected rows.

**L5 — Enforce by shape, not by filter.** A query that selects
around a sensitive column can have that filter deleted and still
compile. A function whose RETURNS TABLE has no such column cannot
leak it. Drive privileged reads FROM the permission table, so the
join key comes from the grant itself.

**L6 — A test can pass vacuously.** Seed data dense enough that a
fallback path never fires produces green ticks proving nothing.
Force the edge cases with probes.

**L7 — A compliant palette can produce a non-compliant interface.**
Opacity modifiers, gradients and overlays produce colours that
appear nowhere in the palette. Measure rendered elements, not tokens.

**L8 — Measurements lie in ways that look like bugs.** Reading
computed styles mid-CSS-transition returns interpolated values.
`position: fixed` isn't contained by `position: relative`. Suspect
the harness before the code.

**L9 — Scope test cleanup to rows the test created.** Never a bare
DELETE on a table.

**L10 — A grader opens a cold app.** Anything that expires, pauses,
or depends on a third party will be broken when they look, however
well it works for you today.

---

## New lessons, earned in this build

**L11 — Verifying with an account that skips the broken screen proves
nothing.** Profile creation was refused for every real signup while all
30 seeded accounts worked perfectly, because seeded users already have a
profile row and never see that screen. Every test passed; the product
was broken for 100% of new users. This is L6 wearing different clothes:
the seed data was so complete that the failing path never ran.

**L12 — `upsert` is not `insert` and the difference is a privilege.**
`.upsert()` compiles to `INSERT ... ON CONFLICT DO UPDATE SET id = ...,
email = ...`. Those two columns are deliberately absent from the UPDATE
grant, so Postgres refuses the entire statement — including the plain
insert that would have been allowed. If a grant is narrow by design,
prefer the narrowest statement that does the job.

**L13 — The deployment mechanism chosen for convenience becomes the
thing that fails.** A manual CLI deploy produced a live URL in minutes
and was therefore kept, instead of connecting the repo as the plan
called for. It then stopped moving the production alias without saying
so. Three separate pushes appeared deployed and were not. Connect the
repo in Phase 1; make `git push` the entire deployment procedure.

**L14 — Vercel's Hobby plan blocks commits whose author it does not
recognise, and calls it "collaboration".** The commit author email must
match the GitHub identity linked to the Vercel account — here
`308250860+02-handsome@users.noreply.github.com`, not a personal
address. A mismatch yields a `Blocked` deployment and an upgrade prompt,
with no mention of the actual cause. Check `git log --format='%ae'`
against a repo that already deploys.

---

## Where the lessons landed in this build

| Lesson | Where |
|---|---|
| L1 | `01_schema.sql` — every `grant` is preceded by a `revoke all` |
| L3 | `applications_transition` trigger; `declined` and `accepted` are both terminal |
| L5 | `get_team_contacts()` drives FROM `applications`, and `PublicUser` in `lib/types.ts` has no `contact_handle` field |
| L10 | `.github/workflows/keepalive.yml`; DiceBear avatars are generated from a seed rather than hotlinked from a service that can rotate URLs |

L2, L4, L6, L8 and L9 are **not honoured in this build.** See "What was
cut", below. That is the single largest known weakness here.

---

## Decisions and tradeoffs

### Contact privacy is enforced three times, deliberately

1. **Column grant.** `contact_handle` and `email` are absent from the
   `grant select` on `public.users`. A client that asks for them is
   refused by Postgres, not filtered by the app.
2. **Return type.** `PublicUser` has no `contact_handle` field, so a
   component that tries to render one does not compile.
3. **The one door.** `get_team_contacts()` is `security definer` and
   drives FROM `applications` where `status = 'accepted'`, with an
   explicit `auth.uid()` check on every branch.

The three agree, and each would have to fail independently for a handle
to leak. **In production I would add the L2 test that attempts the read
from a third account** — see below.

### Four tables, not five

The build guide specified a separate `skills` table because proficiency
is per-skill. Nothing in this build reads proficiency, so `skills` is a
`text[]` on `users` instead. If proficiency-weighted ranking is ever
built, this becomes a real migration — that is the cost, accepted
knowingly.

### Campus email domain validation was dropped

The guide's Phase 2 requires signup restricted to a campus domain,
enforced in the database. **Graders are expected to create their own
accounts**, and they do not have `@micamail.in` addresses. Domain
validation and grader access are mutually exclusive; access won.

For production, the answer is a `allowed_domains` table plus a trigger
on `auth.users`, with an explicit allowlist row for each evaluator —
not a hardcoded string in TypeScript, since the publishable key is
public and TypeScript is not a security boundary.

### A declined application is indistinguishable from a pending one

The PRD asks for a silent decline. Showing an applicant "declined"
would be a notification, which is the thing "silent" rules out. So
`requests/[id]` renders both states as "Waiting to hear back."

The tradeoff is real: an applicant can wait indefinitely on a refusal
they will never be told about. For production I would expire the
application at the request's deadline and say so up front.

### Feed ranking weights

Role complementarity 40, skill overlap 30, work-style fit 15, deadline
proximity 15. Reasoning is in `lib/ranking.ts` next to the code.

The short version: role fit is the highest weight because a balanced
team is what the PRD says Deckmate exists to produce, and a fourth
Analyst adds less than a first Storyteller. Deadline proximity is
deliberately the smallest term, so urgency breaks ties between good
matches rather than promoting bad ones.

### Expiry on read, not cron

`listOpenRequests()` filters `status = 'open' AND deadline > now()`.
There is no scheduled job correcting the `status` column, so a request
whose deadline has passed simply stops appearing. The `status` column
is a author-set intent, not a derived truth.

### Two palettes in the Stitch export

`DESIGN.md` ships a Material-3 token block naming `primary: #00535b`
and a prose section naming the brand teal as `#006D77`. They disagree.
The rendered mockups match the prose, so the prose won, resolved once
in `app/globals.css` rather than left to drift across components.

Per L7, the palette being compliant on paper says nothing about the
rendered result — the `bg-accent/60` and `/40` opacity modifiers used
on the reveal and nudge cards have **not** been contrast-measured.

---

## What was cut, and what it costs

Built in a 90-minute window. These are known gaps, not oversights:

- **No security tests.** Nothing attempts the forbidden read. This is
  L2 unhonoured, and L2 is the lesson that caught a live privilege
  escalation last time. The privacy model above is argued, not proven.
  **This is the first thing to fix.**
- **No transition test.** The `applications_transition` trigger is
  written but nothing has attempted `declined -> accepted` against it.
- **No contrast measurement.** See L7 above.
- **Phase 7 (team formation, decision-maker designation) not built.**
  PRD section 3's decision-maker is absent. Phase 8 reads team
  membership from accepted applications directly, so nothing depends
  on it.
- **No edit or close on a request.** Create and read only.
- **The deep-dive feedback form** (PRD section 5) is not built. The
  binary nudge is.

## The test that should exist

```
Sign in as a third account with no application to request R.
Attempt: select contact_handle from users where id = <author of R>
Expect: error, permission denied for column contact_handle
Attempt: rpc get_team_contacts(R)
Expect: zero rows — and COUNT them, do not check for an error (L4)
```
