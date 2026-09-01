import Link from "next/link";
import {
  getMyProfile,
  getPendingRatings,
  listOpenRequests,
} from "@/lib/queries";
import { rankRequests, deadlineLabel } from "@/lib/ranking";
import { COMP_TYPE_LABEL, COMP_TYPES, ROLE_LABEL } from "@/lib/types";
import type { CompType } from "@/lib/types";
import { Avatar, Chip, EmptyState } from "@/components/deckmate-ui";
import { cn } from "@/lib/utils";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const me = (await getMyProfile())!;

  const [all, pendingRatings] = await Promise.all([
    listOpenRequests(),
    getPendingRatings(me.id),
  ]);

  const filtered =
    type && COMP_TYPES.includes(type as CompType)
      ? all.filter((r) => r.comp_type === type)
      : all;

  const ranked = rankRequests(filtered, me).filter((r) => r.author_id !== me.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Live requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ranked for {/^[AEIOU]/.test(ROLE_LABEL[me.role]) ? "an" : "a"}{" "}
          {ROLE_LABEL[me.role]} — role fit first, then skills.
        </p>
      </div>

      {pendingRatings.length > 0 && (
        <Link
          href="/profile#rate"
          className="dm-card dm-float block border-primary/30 bg-accent/60 p-4"
        >
          <p className="text-sm font-semibold text-accent-foreground">
            {pendingRatings.length} teammate
            {pendingRatings.length > 1 ? "s" : ""} waiting on your rating
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            One tap each. Your own reliability score unlocks when you are done.
          </p>
        </Link>
      )}

      {/* Scrolls sideways on a phone; wraps once there's room for it. */}
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
        <div className="flex w-max gap-2 pb-1 md:w-auto md:flex-wrap">
          <FilterPill href="/feed" label="All" active={!type} />
          {COMP_TYPES.map((t) => (
            <FilterPill
              key={t}
              href={`/feed?type=${t}`}
              label={COMP_TYPE_LABEL[t]}
              active={type === t}
            />
          ))}
        </div>
      </div>

      {ranked.length === 0 ? (
        <EmptyState
          title={type ? "Nothing open in this category" : "No live requests"}
          body={
            type
              ? "Try another competition type, or post what you are looking for and let people come to you."
              : "Every request has either been filled or its deadline has passed. Post yours and be first."
          }
          actionHref="/requests/new"
          actionLabel="Post a request"
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ranked.map((r) => (
            <li key={r.id}>
              <Link
                href={`/requests/${r.id}`}
                className="dm-card flex h-full flex-col p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.comp_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {COMP_TYPE_LABEL[r.comp_type]} · team of {r.team_size}
                    </p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block text-lg font-bold text-primary">
                      {r.score}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                      match
                    </span>
                  </span>
                </div>

                {r.reasons.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.reasons.map((reason) => (
                      <Chip key={reason} tone="accent">
                        {reason}
                      </Chip>
                    ))}
                  </div>
                )}

                {r.skills_needed.length > 0 && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Needs {r.skills_needed.join(", ")}
                  </p>
                )}

                {/* mt-auto pins the byline to the card's base so footers
                    line up across a grid row; the wrapper guarantees a gap
                    above the rule even when the card is full. */}
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Avatar user={r.author} size={28} />
                      <span className="text-xs text-muted-foreground">
                        {r.author.name}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {deadlineLabel(r.deadline)}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "dm-chip whitespace-nowrap border",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {label}
    </Link>
  );
}
