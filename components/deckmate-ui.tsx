import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ROLE_LABEL,
  WORK_STYLE_LABEL,
  type PublicUser,
  type UserRole,
  type WorkStyle,
} from "@/lib/types";

export function Chip({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: "primary" | "muted" | "accent" | "warn";
  className?: string;
}) {
  const tones = {
    primary: "bg-primary text-primary-foreground",
    muted: "bg-muted text-muted-foreground",
    accent: "bg-accent text-accent-foreground",
    warn: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={cn("dm-chip", tones[tone], className)}>{children}</span>
  );
}

export function RoleChip({ role }: { role: UserRole }) {
  return <Chip tone="primary">{ROLE_LABEL[role]}</Chip>;
}

export function WorkStyleChip({ style }: { style: WorkStyle }) {
  return <Chip tone="accent">{WORK_STYLE_LABEL[style]}</Chip>;
}

export function Avatar({
  user,
  size = 48,
}: {
  user: Pick<PublicUser, "name" | "avatar_url">;
  size?: number;
}) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-secondary/40 flex items-center justify-center font-semibold text-secondary-foreground"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar_url}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

/**
 * The reliability score, and the lock that is the whole retention argument.
 *
 * A score you can only see by rating the teams you were on is what gives
 * someone a reason to open DeckMate in week nine. Rendering the lock as a
 * designed state rather than a blank space is the point, not a detail.
 */
export function ReliabilityScore({
  score,
  locked,
  className,
}: {
  score: number | null;
  locked?: boolean;
  className?: string;
}) {
  if (locked) {
    return (
      <div className={cn("dm-card p-4", className)}>
        <p className="text-sm font-semibold">Reliability score — locked</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Rate the teammates you have already worked with and your own score
          unlocks.
        </p>
      </div>
    );
  }
  if (score === null) {
    return (
      <div className={cn("dm-card p-4", className)}>
        <p className="text-sm font-semibold">No score yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          A score appears after your first competition is rated by a teammate.
        </p>
      </div>
    );
  }
  return (
    <div className={cn("dm-card p-4", className)}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">Reliability</p>
        <p className="text-2xl font-bold text-primary">{score}%</p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-primary/15">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Share of past teammates who would team up again.
      </p>
    </div>
  );
}

/** Never a blank screen. Every list in this app routes through here. */
export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="dm-card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function SectionHeading({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold">{children}</h2>
      {action}
    </div>
  );
}
