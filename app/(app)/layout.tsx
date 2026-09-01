import { redirect } from "next/navigation";
import Link from "next/link";
import { getMyProfile, getSessionUserId } from "@/lib/queries";
import { BottomNav, TopNav } from "@/components/app-nav";
import { LogoutButton } from "@/components/logout-button";

/**
 * Authorization lives here and in RLS. The proxy only refreshes the auth
 * cookie — it decides nothing.
 *
 * Two gates, in order: signed in, then has a profile. A user with an auth
 * account but no profile row cannot use any screen in this group, because
 * every one of them assumes a role and a skill list to rank against.
 *
 * Layout: designed at 375px, then scaled up, as AGENTS.md asks. Below md
 * this is a phone — narrow column, fixed bottom bar. From md up the shell
 * widens, the tabs move into the header, and the lists become grids. The
 * alternative, a 448px column centred in a 1440px window, looks like an
 * emulator rather than a product.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/auth/login");

  const profile = await getMyProfile();
  if (!profile) redirect("/profile-setup");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4 px-4 py-3 md:max-w-6xl md:px-8">
          <Link
            href="/feed"
            className="text-lg font-bold tracking-tight md:text-xl"
          >
            Deck<span className="text-primary">Mate</span>
          </Link>
          <TopNav />
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4 md:max-w-6xl md:px-8 md:pb-16 md:pt-8">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
