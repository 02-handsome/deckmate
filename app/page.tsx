import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/queries";

/**
 * Mobile: a single column with the two buttons pinned to the bottom, thumb
 * height. From md up it becomes two columns — copy on the left, the sign-in
 * card on the right — because a 448px column of centred text on a laptop is
 * the thing that makes a web app look like a phone screenshot.
 */
export default async function Landing() {
  const userId = await getSessionUserId();
  if (userId) redirect("/feed");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-6 py-12 md:max-w-5xl md:flex-row md:items-center md:gap-16 md:px-8 md:py-20">
      <div className="flex flex-1 flex-col justify-center md:flex-none md:basis-3/5">
        <p className="text-3xl font-bold tracking-tight">
          Deck<span className="text-primary">Mate</span>
        </p>
        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight md:mt-8 md:text-5xl">
          Find your case competition team.
        </h1>
        <p className="mt-4 max-w-prose text-base text-muted-foreground md:text-lg">
          Post what you need, get ranked matches by role and skill, and swap
          contacts only once you have both said yes.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-muted-foreground md:text-base">
          <Point>Ranked by role fit, not by who posted last</Point>
          <Point>Contacts stay private until an application is accepted</Point>
          <Point>Rate your team afterwards to unlock your reliability score</Point>
        </ul>
      </div>

      <div className="space-y-3 md:basis-2/5 md:rounded-2xl md:border md:bg-card md:p-8 md:shadow-[0_10px_30px_hsl(185_100%_23%/0.05)]">
        <p className="hidden text-sm font-semibold md:block">
          Verified students only
        </p>
        <p className="hidden pb-2 text-sm text-muted-foreground md:block">
          One campus. Takes about two minutes to set up.
        </p>
        <Link
          href="/auth/sign-up"
          className="block rounded-xl bg-primary px-5 py-3.5 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Create an account
        </Link>
        <Link
          href="/auth/login"
          className="block rounded-xl border border-primary px-5 py-3.5 text-center text-sm font-semibold text-primary transition-colors hover:bg-accent"
        >
          I already have one
        </Link>
      </div>
    </main>
  );
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  );
}
