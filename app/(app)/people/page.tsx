import Link from "next/link";
import { getMyProfile, listUsers } from "@/lib/queries";
import { ROLES, ROLE_LABEL, type UserRole } from "@/lib/types";
import { Avatar, Chip, EmptyState } from "@/components/deckmate-ui";
import { cn } from "@/lib/utils";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const me = (await getMyProfile())!;
  const everyone = await listUsers();

  const people = everyone
    .filter((u) => u.id !== me.id)
    .filter((u) => (role && ROLES.includes(role as UserRole) ? u.role === role : true));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Find a teammate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse by the role you are missing.
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2 pb-1">
          <FilterPill href="/people" label="All roles" active={!role} />
          {ROLES.map((r) => (
            <FilterPill
              key={r}
              href={`/people?role=${r}`}
              label={ROLE_LABEL[r]}
              active={role === r}
            />
          ))}
        </div>
      </div>

      {people.length === 0 ? (
        <EmptyState
          title="Nobody with that role yet"
          body="Try another role, or post a request and let the feed put you in front of the right people."
          actionHref="/requests/new"
          actionLabel="Post a request"
        />
      ) : (
        <ul className="space-y-3">
          {people.map((u) => (
            <li key={u.id}>
              <Link href={`/people/${u.id}`} className="dm-card block p-4">
                <div className="flex items-start gap-3">
                  <Avatar user={u} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Section {u.section}, {u.year}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Chip tone="primary">{ROLE_LABEL[u.role]}</Chip>
                      {u.skills.slice(0, 2).map((s) => (
                        <Chip key={s} tone="muted">
                          {s}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  {u.reliability_score !== null && (
                    <span className="shrink-0 text-right">
                      <span className="block text-base font-bold text-primary">
                        {u.reliability_score}%
                      </span>
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                        reliable
                      </span>
                    </span>
                  )}
                </div>
                {u.credibility_line && (
                  <p className="mt-3 border-t pt-3 text-sm italic text-muted-foreground">
                    &ldquo;{u.credibility_line}&rdquo;
                  </p>
                )}
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
