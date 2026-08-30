/**
 * L2 — for every "user X must not be able to do Y", write the test that
 * attempts Y. Reading the code proves nothing; only the attempt does.
 *
 * Run:  node scripts/verify-privacy.mjs
 * Needs .env.local with NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and the seed data loaded.
 *
 * Every seeded account's password is deckmate123.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// --- env ---------------------------------------------------------------
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// --- fixtures ----------------------------------------------------------
// Request 7 (Deloitte Maverick) is authored by Sara Chen with Sneha and
// Rohan accepted onto it. Farhan has no connection to it at all.
const REQUEST = "10000000-0000-4000-8000-000000000007";
const AUTHOR = { email: "sara.chen@micamail.in", id: "00000000-0000-4000-8000-000000000002" };
const MEMBER = { email: "sneha.pillai@micamail.in", id: "00000000-0000-4000-8000-000000000016" };
const OUTSIDER = { email: "farhan.ali@micamail.in", id: "00000000-0000-4000-8000-000000000030" };
// The only declined application in the seed is on request 4, which Arjun
// authored — so he is the one whose RLS policy can see it to attempt the
// forbidden transition.
const DECLINER = { email: "arjun.desai@micamail.in", id: "00000000-0000-4000-8000-000000000009" };

let failures = 0;

function check(name, passed, detail) {
  console.log(`${passed ? "  PASS" : "  FAIL"}  ${name}`);
  if (detail) console.log(`        ${detail}`);
  if (!passed) failures++;
}

async function signIn(email) {
  const c = createClient(URL_, KEY);
  const { error } = await c.auth.signInWithPassword({
    email,
    password: "deckmate123",
  });
  if (error) throw new Error(`could not sign in as ${email}: ${error.message}`);
  return c;
}

// -----------------------------------------------------------------------
console.log("\nDeckmate privacy verification\n");

const outsider = await signIn(OUTSIDER.email);

console.log("An outsider attempts to read a contact handle directly:");
{
  const { data, error } = await outsider
    .from("users")
    .select("id,contact_handle")
    .eq("id", AUTHOR.id);
  // L4: an RLS block returns zero rows, not an error. A column grant
  // refusal DOES error. Accept either, but never a row with a handle.
  const leaked = (data ?? []).some((r) => r.contact_handle);
  check(
    "select contact_handle is refused",
    !leaked,
    error ? `refused: ${error.message}` : `returned ${(data ?? []).length} rows, no handle`,
  );
}

console.log("\nAn outsider attempts the reveal RPC on a team they are not on:");
{
  const { data, error } = await outsider.rpc("get_team_contacts", {
    p_request_id: REQUEST,
  });
  // L4 again: count the rows. Zero rows and a working policy look the
  // same as zero rows and a broken one if you only check for an error.
  const rows = (data ?? []).length;
  check("get_team_contacts returns zero rows", !error && rows === 0, `rows: ${rows}`);
}

console.log("\nAn outsider attempts select * on users:");
{
  const { error } = await outsider.from("users").select("*").limit(1);
  check(
    "select * is refused by the column grant",
    !!error,
    error ? error.message : "NO ERROR — the grant is wider than intended",
  );
}

// -----------------------------------------------------------------------
console.log("\nA real team member uses the same RPC:");
{
  const member = await signIn(MEMBER.email);
  const { data, error } = await member.rpc("get_team_contacts", {
    p_request_id: REQUEST,
  });
  const rows = (data ?? []).length;
  // L6: if this returns zero the outsider test above passed vacuously —
  // it would prove the function is broken, not that the policy works.
  check(
    "an accepted member DOES get contacts (proves the test isn't vacuous)",
    !error && rows > 0,
    `rows: ${rows}${rows ? ` — ${data.map((d) => d.name).join(", ")}` : ""}`,
  );
}

// -----------------------------------------------------------------------
console.log("\nL3 — a terminal status attempts to move again:");
{
  const author = await signIn(DECLINER.email);
  const { data: declined } = await author
    .from("applications")
    .select("id,status")
    .eq("status", "declined")
    .limit(1);

  if (!declined?.length) {
    check("declined -> accepted is refused", false, "no declined row found to test with");
  } else {
    const { error } = await author
      .from("applications")
      .update({ status: "accepted" })
      .eq("id", declined[0].id);
    check(
      "declined -> accepted is refused by the trigger",
      !!error,
      error ? error.message : "NO ERROR — a refusal was silently revived",
    );
  }
}

// -----------------------------------------------------------------------
console.log(
  `\n${failures === 0 ? "All checks passed." : `${failures} CHECK(S) FAILED.`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
