"use client";

import { useState } from "react";
import { normaliseContact } from "@/lib/contact";

/**
 * The contact input, with live feedback.
 *
 * It calls the same normaliseContact() the server action calls, so the
 * message you see while typing is by construction the message you would
 * get on submit. The alternative — an HTML `pattern` — cannot count digits
 * through spaces and gives a browser tooltip nobody reads.
 *
 * This is convenience only. The rule is enforced by the CHECK constraint
 * in supabase/03_contact_format.sql; a client can always POST past this.
 */
export function ContactField() {
  const [raw, setRaw] = useState("");
  const touched = raw.trim().length > 0;
  const result = touched ? normaliseContact(raw) : null;

  const digitsOnly = !raw.trim().startsWith("@");
  const digitCount = raw.replace(/\D/g, "").length;

  return (
    <div>
      <label htmlFor="contact_handle" className="text-sm font-semibold">
        Contact handle or mobile number
      </label>
      <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
        An @handle, or a 10-digit mobile number. Shared only after you accept
        someone, or they accept you.
      </p>

      <input
        id="contact_handle"
        name="contact_handle"
        required
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        autoComplete="off"
        inputMode={digitsOnly && digitCount > 0 ? "numeric" : "text"}
        aria-invalid={result ? !result.ok : undefined}
        aria-describedby="contact_feedback"
        className={`w-full rounded-xl border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
          result && !result.ok
            ? "border-destructive focus:border-destructive focus:ring-destructive"
            : "border-input focus:border-primary focus:ring-primary"
        }`}
        placeholder="@yourhandle or 9876543210"
      />

      <p
        id="contact_feedback"
        aria-live="polite"
        className={`mt-1.5 text-xs ${
          result && !result.ok ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {!result
          ? " "
          : result.ok
            ? result.value.startsWith("@")
              ? `Looks good — handle ${result.value}`
              : `Looks good — 10-digit number ${result.value}`
            : result.error}
      </p>
    </div>
  );
}
