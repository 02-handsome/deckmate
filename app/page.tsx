import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/queries";

export default async function Landing() {
  const userId = await getSessionUserId();
  if (userId) redirect("/feed");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-6 py-12">
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-3xl font-bold tracking-tight">
          Deck<span className="text-primary">Mate</span>
        </p>
        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight">
          Find your case competition team.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Post what you need, get ranked matches by role and skill, and swap
          contacts only once you have both said yes.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
          <Point>Ranked by role fit, not by who posted last</Point>
          <Point>Contacts stay private until an application is accepted</Point>
          <Point>Rate your team afterwards to unlock your reliability score</Point>
        </ul>
      </div>

      <div className="space-y-3">
        <Link
          href="/auth/sign-up"
          className="block rounded-xl bg-primary px-5 py-3.5 text-center text-sm font-semibold text-primary-foreground"
        >
          Create an account
        </Link>
        <Link
          href="/auth/login"
          className="block rounded-xl border border-primary px-5 py-3.5 text-center text-sm font-semibold text-primary"
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
