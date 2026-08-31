/**
 * Contact handle format — one definition, used by the form, the server
 * action, and (in the same shape) the database CHECK constraint.
 *
 * A contact is either:
 *   - an @handle:      @sarachen, @aarav_mehta
 *   - a mobile number: exactly 10 digits
 *
 * Keeping the rule in one file is the point. Three copies of a validation
 * rule drift, and the copy that drifts is always the one that matters.
 */

export const HANDLE_PATTERN = "@[A-Za-z0-9._]{2,30}";
export const PHONE_PATTERN = "[0-9]{10}";

/** For the `pattern` attribute on the input. Mirrors the two rules above. */
export const CONTACT_INPUT_PATTERN = `(${HANDLE_PATTERN})|(${PHONE_PATTERN})`;

const HANDLE_RE = new RegExp(`^${HANDLE_PATTERN}$`);
const PHONE_RE = new RegExp(`^${PHONE_PATTERN}$`);

export type ContactResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/**
 * Validate and normalise what someone typed.
 *
 * Numbers are normalised by stripping spaces, dashes and brackets before
 * counting, so "98765 43210" is accepted and stored as "9876543210". A
 * country code is not stripped — "+91 9876543210" is 12 digits and is
 * rejected, which is deliberate: silently discarding a prefix would mean
 * storing a different number from the one the user checked.
 */
export function normaliseContact(raw: string): ContactResult {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return { ok: false, error: "A contact handle or mobile number is required." };
  }

  if (trimmed.startsWith("@")) {
    if (!HANDLE_RE.test(trimmed)) {
      return {
        ok: false,
        error:
          "A handle must be @ followed by 2–30 letters, numbers, dots or underscores.",
      };
    }
    return { ok: true, value: trimmed };
  }

  const digits = trimmed.replace(/[\s\-()]/g, "");

  if (!PHONE_RE.test(digits)) {
    const count = digits.replace(/\D/g, "").length;
    if (/\D/.test(digits)) {
      return {
        ok: false,
        error:
          "Enter a 10-digit mobile number, or an @handle if you'd rather not share a number.",
      };
    }
    return {
      ok: false,
      error: `A mobile number must be exactly 10 digits — you entered ${count}.`,
    };
  }

  return { ok: true, value: digits };
}
