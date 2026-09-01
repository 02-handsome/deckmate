"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * One tab list, two presentations.
 *
 * Below md the app keeps its phone shape: a fixed bottom bar, thumb-reachable.
 * From md up that bar is hidden and the same tabs sit inline in the header,
 * because a floating bottom bar on a 1440px screen reads as a phone emulator
 * rather than a web app.
 *
 * Both come from this file on purpose. Two copies of a nav drift, and the
 * copy that drifts is the one you are not looking at.
 */
const TABS = [
  { href: "/feed", label: "Feed", icon: FeedIcon },
  { href: "/people", label: "People", icon: PeopleIcon },
  { href: "/requests/new", label: "Post", icon: PostIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) =>
    pathname === href ||
    (href !== "/requests/new" && pathname.startsWith(`${href}/`));
}

/** Inline tabs in the header. Hidden below md. */
export function TopNav() {
  const isActive = useActive();

  return (
    <nav className="hidden md:block" aria-label="Main">
      <ul className="flex items-center gap-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Fixed bottom bar. Hidden from md up. */
export function BottomNav() {
  const isActive = useActive();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t bg-card px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Main"
    >
      <ul className="flex items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-2.5"
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active ? "bg-accent text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon />
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const svg = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function FeedIcon() {
  return (
    <svg {...svg}>
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="18" height="6" rx="2" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg {...svg}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

function PostIcon() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
    </svg>
  );
}
