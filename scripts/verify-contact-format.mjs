/**
 * Does the DATABASE reject a badly formatted contact handle?
 *
 * lib/contact.ts validates too, but that is a courtesy — the publishable
 * key is public, so anyone can POST straight past the form. Only the CHECK
 * constraint actually holds. So this attempts the writes rather than
 * trusting the app to prevent them (L2).
 *
 * Run:  node scripts/verify-contact-format.mjs
 *
 * Writes nothing permanent: invalid values are rejected and change nothing,
 * and the one valid write restores the value that was already there (L9).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const TESTER = "farhan.ali@micamail.in";

let failures = 0;
function check(name, passed, detail) {
  console.log(`${passed ? "  PASS" : "  FAIL"}  ${name}`);
  if (detail) console.log(`        ${detail}`);
  if (!passed) failures++;
}

const c = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
const { error: signInError } = await c.auth.signInWithPassword({
  email: TESTER,
  password: "deckmate123",
});
if (signInError) {
  console.log(`could not sign in as ${TESTER}: ${signInError.message}`);
  process.exit(1);
}
const { data: me } = await c.auth.getUser();
const userId = me.user.id;

// Read the current value so it can be put back afterwards.
const { data: profile } = await c.rpc("get_my_profile");
const original = profile?.[0]?.contact_handle;
if (!original) {
  console.log("could not read own contact_handle via get_my_profile");
  process.exit(1);
}

async function attempt(value) {
  return c.from("users").update({ contact_handle: value }).eq("id", userId);
}

console.log("\nContact format enforcement (attempted at the database)\n");

const shouldFail = [
  ["98765", "5 digits"],
  ["987654321", "9 digits"],
  ["98765432101", "11 digits"],
  ["+919876543210", "country code makes it 12 digits"],
  ["9876 543 210", "digits with spaces stored raw"],
  ["not-a-number", "free text"],
  ["@", "bare @"],
  ["@a", "handle too short"],
  ["", "empty"],
];

for (const [value, why] of shouldFail) {
  const { error } = await attempt(value);
  // 23514 = check_violation. Anything that is not an error means the
  // constraint let it through.
  check(
    `rejected: ${JSON.stringify(value)} (${why})`,
    !!error,
    error ? `${error.code}: ${error.message.slice(0, 70)}` : "NO ERROR — accepted",
  );
}

console.log("\nValid values are still accepted:");
for (const value of ["9876543210", "@some.handle_2"]) {
  const { error } = await attempt(value);
  check(`accepted: ${JSON.stringify(value)}`, !error, error?.message);
}

// Put it back exactly as it was.
const { error: restoreError } = await attempt(original);
check(
  "original value restored",
  !restoreError,
  restoreError ? restoreError.message : `back to ${original}`,
);

console.log(
  `\n${failures === 0 ? "All checks passed." : `${failures} CHECK(S) FAILED.`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
