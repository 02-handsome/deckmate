import Link from "next/link";
import { submitRating } from "@/app/actions";
import { getMyProfile, getMyRequests, getPendingRatings } from "@/lib/queries";
import { deadlineLabel } from "@/lib/ranking";
import { COMP_TYPE_LABEL, ROLE_LABEL, WORK_STYLE_LABEL } from "@/lib/types";
import {
  Avatar,
  Chip,
  EmptyState,
  ReliabilityScore,
  SectionHeading,
} from "@/components/deckmate-ui";

export default async function ProfilePage() {
  const me = (await getMyProfile())!;
  const [pending, myRequests] = await Promise.all([
    getPendingRatings(me.id),
    getMyRequests(me.id),
  ]);

  /*
    The gate. You see your own score only once you have rated everyone you
    owe a rating to. This is the retention mechanism the PRD names — it is
    what gives someone a reason to open DeckMate after their competition is
    already over.
  */
  const locked = pending.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar user={me} size={72} />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {me.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Section {me.section}, {me.year}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone="primary">{ROLE_LABEL[me.role]}</Chip>
            <Chip tone="accent">{WORK_STYLE_LABEL[me.work_style]}</Chip>
          </div>
        </div>
      </div>

      <ReliabilityScore score={me.reliability_score} locked={locked} />

      {/* ---------- Phase 8: the nudge ---------- */}
      <section id="rate" className="scroll-mt-20">
        <SectionHeading>Rate your teammates</SectionHeading>
        {pending.length === 0 ? (
          <EmptyState
            title="Nothing to rate"
            body="After a competition's deadline passes, everyone you teamed with shows up here. One tap each."
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {pending.map(({ request, teammate }) => (
              <li key={`${request.id}:${teammate.id}`} className="dm-card p-4">
                <div className="flex items-center gap-3">
                  <Avatar user={teammate} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{teammate.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {request.comp_name}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium">Would you team up again?</p>
                <div className="mt-2 flex gap-2">
                  <form action={submitRating} className="flex-1">
                    <input type="hidden" name="request_id" value={request.id} />
                    <input type="hidden" name="rated_id" value={teammate.id} />
                    <input type="hidden" name="would_team_again" value="yes" />
                    <button className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                      Yes
                    </button>
                  </form>
                  <form action={submitRating} className="flex-1">
                    <input type="hidden" name="request_id" value={request.id} />
                    <input type="hidden" name="rated_id" value={teammate.id} />
                    <input type="hidden" name="would_team_again" value="no" />
                    <button className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground">
                      No
                    </button>
                  </form>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  They never see who said what — only their percentage.
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading
          action={
            <Link href="/requests/new" className="text-sm font-medium text-primary">
              New
            </Link>
          }
        >
          Your requests
        </SectionHeading>
        {myRequests.length === 0 ? (
          <EmptyState
            title="You haven't posted yet"
            body="Posting is how people find you. Say which role you are missing and the feed does the rest."
            actionHref="/requests/new"
            actionLabel="Post a request"
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {myRequests.map((r) => (
              <li key={r.id}>
                <Link href={`/requests/${r.id}`} className="dm-card block p-4">
                  <p className="font-semibold">{r.comp_name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {COMP_TYPE_LABEL[r.comp_type]} · {deadlineLabel(r.deadline)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading>Your contact handle</SectionHeading>
        <div className="dm-card p-4">
          <p className="font-mono text-sm text-primary">{me.contact_handle}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Only you can see this. It reaches another student the moment an
            application between you is accepted, and not before.
          </p>
        </div>
      </section>
    </div>
  );
}
