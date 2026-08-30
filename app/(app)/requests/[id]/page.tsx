import Link from "next/link";
import { notFound } from "next/navigation";
import { applyToRequest, decideApplication } from "@/app/actions";
import {
  getApplicants,
  getMyApplication,
  getMyProfile,
  getRequest,
  getTeamContacts,
} from "@/lib/queries";
import { deadlineLabel, daysUntil } from "@/lib/ranking";
import { COMP_TYPE_LABEL, ROLE_LABEL } from "@/lib/types";
import { Avatar, Chip, EmptyState, SectionHeading } from "@/components/deckmate-ui";

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ applied?: string; posted?: string }>;
}) {
  const { id } = await params;
  const { applied, posted } = await searchParams;

  const me = (await getMyProfile())!;
  const request = await getRequest(id);
  if (!request) notFound();

  const isAuthor = request.author_id === me.id;
  const expired = daysUntil(request.deadline) < 0;

  const [applicants, myApplication, contacts] = await Promise.all([
    isAuthor ? getApplicants(id) : Promise.resolve([]),
    isAuthor ? Promise.resolve(null) : getMyApplication(id, me.id),
    getTeamContacts(id),
  ]);

  const contactByUser = new Map(contacts.map((c) => [c.user_id, c]));

  return (
    <div className="space-y-5">
      {posted && (
        <div className="dm-card dm-float border-primary/30 bg-accent/60 p-4">
          <p className="text-sm font-semibold">Your post is live</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It is now ranked into everyone&rsquo;s feed by how well they fit it.
          </p>
        </div>
      )}

      <div>
        <Link href="/feed" className="text-sm text-muted-foreground">
          ← Back to feed
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {request.comp_name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Chip tone="primary">{COMP_TYPE_LABEL[request.comp_type]}</Chip>
          <Chip tone="muted">Team of {request.team_size}</Chip>
          <Chip tone={expired ? "warn" : "accent"}>
            {deadlineLabel(request.deadline)}
          </Chip>
        </div>
      </div>

      <div className="dm-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Posted by
        </p>
        <Link
          href={`/people/${request.author.id}`}
          className="mt-2 flex items-center gap-3"
        >
          <Avatar user={request.author} size={44} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{request.author.name}</p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABEL[request.author.role]} · Section{" "}
              {request.author.section}, {request.author.year}
            </p>
          </div>
        </Link>
      </div>

      {(request.roles_needed.length > 0 || request.skills_needed.length > 0) && (
        <div className="dm-card space-y-4 p-4">
          {request.roles_needed.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Roles needed
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {request.roles_needed.map((r) => (
                  <Chip key={r} tone="primary">
                    {ROLE_LABEL[r]}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {request.skills_needed.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Skills needed
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {request.skills_needed.map((s) => (
                  <Chip key={s} tone="muted">
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- the reveal ---------- */}
      {contacts.length > 0 && (
        <div className="dm-card border-primary/40 bg-accent/40 p-4">
          <SectionHeading>Your team&rsquo;s contacts</SectionHeading>
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li
                key={c.user_id}
                className="flex items-center justify-between rounded-xl bg-card px-3 py-2.5"
              >
                <span className="text-sm font-medium">{c.name}</span>
                <span className="font-mono text-sm text-primary">
                  {c.contact_handle}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Visible because an application between you was accepted. Nobody
            else on DeckMate can see these.
          </p>
        </div>
      )}

      {/* ---------- author's view ---------- */}
      {isAuthor ? (
        <div>
          <SectionHeading>
            Applicants{applicants.length > 0 && ` (${applicants.length})`}
          </SectionHeading>

          {applicants.length === 0 ? (
            <EmptyState
              title="No applicants yet"
              body="Your request is ranked into the feed of everyone whose role and skills fit it. Give it a day."
            />
          ) : (
            <ul className="space-y-3">
              {applicants.map((a) => {
                const contact = contactByUser.get(a.applicant.id);
                return (
                  <li key={a.id} className="dm-card p-4">
                    <div className="flex items-start gap-3">
                      <Avatar user={a.applicant} size={44} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/people/${a.applicant.id}`}
                          className="truncate font-semibold"
                        >
                          {a.applicant.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {ROLE_LABEL[a.applicant.role]} · Section{" "}
                          {a.applicant.section}, {a.applicant.year}
                        </p>
                        {a.applicant.reliability_score !== null && (
                          <p className="mt-1 text-xs font-medium text-primary">
                            {a.applicant.reliability_score}% would team again
                          </p>
                        )}
                      </div>
                      <Chip
                        tone={
                          a.status === "accepted"
                            ? "primary"
                            : a.status === "declined"
                              ? "warn"
                              : "muted"
                        }
                      >
                        {a.status}
                      </Chip>
                    </div>

                    {a.applicant.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {a.applicant.skills.slice(0, 4).map((s) => (
                          <Chip key={s} tone="muted">
                            {s}
                          </Chip>
                        ))}
                      </div>
                    )}

                    {/* A pending applicant's contact is simply not on this page. */}
                    {a.status === "pending" && (
                      <div className="mt-4 flex gap-2">
                        <form action={decideApplication} className="flex-1">
                          <input type="hidden" name="application_id" value={a.id} />
                          <input type="hidden" name="request_id" value={id} />
                          <input type="hidden" name="decision" value="accepted" />
                          <button className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                            Accept
                          </button>
                        </form>
                        <form action={decideApplication} className="flex-1">
                          <input type="hidden" name="application_id" value={a.id} />
                          <input type="hidden" name="request_id" value={id} />
                          <input type="hidden" name="decision" value="declined" />
                          <button className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground">
                            Decline
                          </button>
                        </form>
                      </div>
                    )}

                    {a.status === "accepted" && contact && (
                      <p className="mt-3 rounded-xl bg-accent/50 px-3 py-2 font-mono text-sm text-primary">
                        {contact.contact_handle}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        /* ---------- applicant's view ---------- */
        <div className="dm-card p-4">
          {applied && !myApplication && (
            <p className="mb-3 text-sm text-muted-foreground">
              Sending your application…
            </p>
          )}

          {myApplication?.status === "accepted" ? (
            <div>
              <p className="font-semibold text-primary">You&rsquo;re on the team</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Contacts are above. Message them directly — DeckMate does not
                carry the conversation.
              </p>
            </div>
          ) : myApplication ? (
            /*
              A declined application reads identically to a pending one.
              The PRD asks for a silent decline, and telling the applicant
              they were refused is exactly what "silent" rules out.
            */
            <div>
              <p className="font-semibold">Waiting to hear back</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {request.author.name} will see your profile and reliability
                score, but not your contact handle.
              </p>
            </div>
          ) : expired ? (
            <div>
              <p className="font-semibold">This deadline has passed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Applications closed {deadlineLabel(request.deadline).toLowerCase()}.
              </p>
            </div>
          ) : (
            <form action={applyToRequest}>
              <input type="hidden" name="request_id" value={id} />
              <p className="mb-3 text-sm text-muted-foreground">
                They will see your role, skills and reliability score. Your
                contact handle stays hidden unless they accept.
              </p>
              <button className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground">
                Apply to this team
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
