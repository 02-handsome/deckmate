import { redirect } from "next/navigation";
import { saveProfile } from "@/app/actions";
import { ContactField } from "@/components/contact-field";
import { getMyProfile, getSessionUserId } from "@/lib/queries";
import { ROLES, ROLE_LABEL, SKILLS, WORK_STYLES, WORK_STYLE_LABEL } from "@/lib/types";

/**
 * The gate between having an account and being usable by the matcher.
 *
 * Role is required and is not the same axis as "specialisation" — the four
 * roles are what make a team balanced, and the feed ranks on them. The
 * Stitch mockup asked for a specialisation instead, which would have left
 * the ranker with nothing to rank.
 */
export default async function ProfileSetup({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const userId = await getSessionUserId();
  if (!userId) redirect("/auth/login");
  if (await getMyProfile()) redirect("/feed");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <p className="text-lg font-bold tracking-tight">
        Deck<span className="text-primary">Mate</span>
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Build your profile
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Let others know what you bring to the table.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error === "missing"
            ? "Name, role and contact handle are all required."
            : error}
        </p>
      )}

      <form action={saveProfile} className="mt-6 space-y-5">
        <Field label="Name">
          <input name="name" required className={input} placeholder="Your full name" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Section">
            <select name="section" className={input} defaultValue="A">
              {["A", "B", "C", "D"].map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Graduating year">
            <select name="year" className={input} defaultValue="2026">
              {[2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Your role on a team" hint="What the feed ranks on.">
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r, i) => (
              <label key={r} className={radioCard}>
                <input
                  type="radio"
                  name="role"
                  value={r}
                  required
                  defaultChecked={i === 0}
                  className="peer sr-only"
                />
                <span className={radioInner}>{ROLE_LABEL[r]}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Work style" hint="Prevents friction in 24-hour live cracks.">
          <div className="grid grid-cols-3 gap-2">
            {WORK_STYLES.map((w) => (
              <label key={w} className={radioCard}>
                <input
                  type="radio"
                  name="work_style"
                  value={w}
                  defaultChecked={w === "flexible"}
                  className="peer sr-only"
                />
                <span className={radioInner}>{WORK_STYLE_LABEL[w]}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Skills" hint="Pick everything you can genuinely carry.">
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <label key={s} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="skills"
                  value={s}
                  className="peer sr-only"
                />
                <span className="dm-chip border border-border bg-card text-muted-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
                  {s}
                </span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Credibility line" hint="One line. What should a stranger trust you for?">
          <input
            name="credibility_line"
            className={input}
            placeholder="Winner, 2025 McKinsey Case Challenge"
          />
        </Field>

        <ContactField />

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground"
        >
          Finish and see the feed
        </button>
      </form>
    </main>
  );
}

const input =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

const radioCard = "cursor-pointer";
const radioInner =
  "flex items-center justify-center rounded-xl border border-border bg-card px-3 py-2.5 text-center text-xs font-medium text-muted-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      {hint && <p className="mb-2 mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className={hint ? "" : "mt-2"}>{children}</div>
    </div>
  );
}
