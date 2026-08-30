import { createRequest } from "@/app/actions";
import {
  COMP_TYPES,
  COMP_TYPE_LABEL,
  ROLES,
  ROLE_LABEL,
  SKILLS,
} from "@/lib/types";

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const today = new Date();
  const min = today.toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Post a team request
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell people what the gap on your team looks like.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error === "missing"
            ? "A competition name and a deadline are both required."
            : error}
        </p>
      )}

      <form action={createRequest} className="mt-6 space-y-5">
        <Field label="Competition name">
          <input
            name="comp_name"
            required
            className={input}
            placeholder="e.g. McKinsey Case Challenge"
          />
        </Field>

        <Field label="Competition type">
          <div className="grid grid-cols-2 gap-2">
            {COMP_TYPES.map((t, i) => (
              <label key={t} className="cursor-pointer">
                <input
                  type="radio"
                  name="comp_type"
                  value={t}
                  defaultChecked={i === 0}
                  className="peer sr-only"
                />
                <span className={radioInner}>{COMP_TYPE_LABEL[t]}</span>
              </label>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Deadline">
            <input
              type="date"
              name="deadline"
              required
              min={min}
              className={input}
            />
          </Field>
          <Field label="Team size">
            <select name="team_size" className={input} defaultValue="3">
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} people
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Roles you need"
          hint="The strongest ranking signal. Pick the gaps, not what you already have."
        >
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <label key={r} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="roles_needed"
                  value={r}
                  className="peer sr-only"
                />
                <span className={radioInner}>{ROLE_LABEL[r]}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Skills you need">
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <label key={s} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="skills_needed"
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

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground"
        >
          Post request
        </button>
      </form>
    </div>
  );
}

const input =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

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
