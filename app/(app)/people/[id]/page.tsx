import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/queries";
import { ROLE_LABEL, WORK_STYLE_LABEL } from "@/lib/types";
import { Avatar, Chip, ReliabilityScore } from "@/components/deckmate-ui";

/**
 * Somebody else's profile.
 *
 * There is no contact handle anywhere on this page and no way to add one:
 * getUser() selects an explicit column list, and the database would refuse
 * the column even if that list were widened by mistake.
 */
export default async function ProfileDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <div className="space-y-5">
      <Link href="/people" className="text-sm text-muted-foreground">
        ← Back to people
      </Link>

      <div className="flex items-center gap-4">
        <Avatar user={user} size={72} />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Section {user.section}, {user.year}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone="primary">{ROLE_LABEL[user.role]}</Chip>
            <Chip tone="accent">{WORK_STYLE_LABEL[user.work_style]}</Chip>
          </div>
        </div>
      </div>

      {user.credibility_line && (
        <p className="dm-card p-4 text-sm italic text-muted-foreground">
          &ldquo;{user.credibility_line}&rdquo;
        </p>
      )}

      <ReliabilityScore score={user.reliability_score} />

      <div className="dm-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Core competencies
        </p>
        {user.skills.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No skills listed yet.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.skills.map((s) => (
              <Chip key={s} tone="muted">
                {s}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="dm-card p-4">
        <p className="text-sm font-semibold">Want to work with {user.name.split(" ")[0]}?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          DeckMate does not do cold outreach. Apply to one of their requests,
          or post your own and let the feed put you in front of them.
        </p>
        <Link
          href="/feed"
          className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Browse their requests
        </Link>
      </div>
    </div>
  );
}
