import { redirect } from "next/navigation";
import Link from "next/link";
import { getMyProfile, getSessionUserId } from "@/lib/queries";
import { BottomNav } from "@/components/bottom-nav";
import { LogoutButton } from "@/components/logout-button";

/**
 * Authorization lives here and in RLS. The proxy only refreshes the auth
 * cookie — it decides nothing.
 *
 * Two gates, in order: signed in, then has a profile. A user with an auth
 * account but no profile row cannot use any screen in this group, because
 * every one of them assumes a role and a skill list to rank against.
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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
        <Link href="/feed" className="text-lg font-bold tracking-tight">
          Deck<span className="text-primary">Mate</span>
        </Link>
        <LogoutButton />
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <BottomNav />
    </div>
  );
}
