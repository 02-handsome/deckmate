"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CompType, UserRole, WorkStyle } from "@/lib/types";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect("/auth/login");
  return id as string;
}

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const userId = await requireUserId();

  const { data: claims } = await supabase.auth.getClaims();
  const email = (claims?.claims?.email as string) ?? "";

  const row = {
    id: userId,
    email,
    name: String(formData.get("name") ?? "").trim(),
    year: Number(formData.get("year") ?? new Date().getFullYear()),
    section: String(formData.get("section") ?? "").trim() || null,
    role: formData.get("role") as UserRole,
    work_style: formData.get("work_style") as WorkStyle,
    skills: formData.getAll("skills").map(String),
    credibility_line:
      String(formData.get("credibility_line") ?? "").trim() || null,
    contact_handle: String(formData.get("contact_handle") ?? "").trim(),
    avatar_url: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
      String(formData.get("name") ?? "deckmate").replace(/\s/g, ""),
    )}`,
  };

  if (!row.name || !row.contact_handle || !row.role) {
    redirect("/profile-setup?error=missing");
  }

  /*
    insert, not upsert.

    An upsert compiles to INSERT ... ON CONFLICT DO UPDATE SET id = ...,
    email = ..., and the UPDATE grant deliberately excludes both of those
    columns — you should not be able to rewrite your own id or the email
    your account is keyed on. Postgres refuses the whole statement with
    "permission denied for table users", so profile creation failed for
    every new account while working fine for seeded ones.

    This path only ever creates: the page redirects to /feed if a profile
    already exists. A 23505 here means that redirect was raced, so send
    them where they were going anyway rather than showing an error.
  */
  const { error } = await supabase.from("users").insert(row);

  if (error) {
    if (error.code === "23505") redirect("/feed");
    redirect(`/profile-setup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/feed");
}

export async function createRequest(formData: FormData) {
  const supabase = await createClient();
  const userId = await requireUserId();

  const deadline = String(formData.get("deadline") ?? "");
  const row = {
    author_id: userId,
    comp_name: String(formData.get("comp_name") ?? "").trim(),
    comp_type: formData.get("comp_type") as CompType,
    skills_needed: formData.getAll("skills_needed").map(String),
    roles_needed: formData.getAll("roles_needed").map(String) as UserRole[],
    team_size: Number(formData.get("team_size") ?? 3),
    deadline: new Date(`${deadline}T23:59:00`).toISOString(),
  };

  if (!row.comp_name || !deadline) {
    redirect("/requests/new?error=missing");
  }

  const { data, error } = await supabase
    .from("requests")
    .insert(row)
    .select("id")
    .single();

  if (error) redirect(`/requests/new?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/feed");
  redirect(`/requests/${data!.id}?posted=1`);
}

export async function applyToRequest(formData: FormData) {
  const supabase = await createClient();
  const userId = await requireUserId();
  const requestId = String(formData.get("request_id"));

  await supabase
    .from("applications")
    .insert({ request_id: requestId, applicant_id: userId });

  revalidatePath(`/requests/${requestId}`);
  redirect(`/requests/${requestId}?applied=1`);
}

/**
 * Accept or decline. The database refuses any second transition — see the
 * applications_transition trigger. Declining is silent by design: nothing
 * here notifies the applicant, and the PRD asks for exactly that.
 */
export async function decideApplication(formData: FormData) {
  const supabase = await createClient();
  await requireUserId();

  const applicationId = String(formData.get("application_id"));
  const requestId = String(formData.get("request_id"));
  const decision = String(formData.get("decision"));

  if (decision !== "accepted" && decision !== "declined") return;

  await supabase
    .from("applications")
    .update({ status: decision })
    .eq("id", applicationId);

  revalidatePath(`/requests/${requestId}`);
}

/** Phase 8. One tap, binary, and it is what unlocks your own score. */
export async function submitRating(formData: FormData) {
  const supabase = await createClient();
  const userId = await requireUserId();

  await supabase.from("ratings").insert({
    request_id: String(formData.get("request_id")),
    rater_id: userId,
    rated_id: String(formData.get("rated_id")),
    would_team_again: String(formData.get("would_team_again")) === "yes",
  });

  revalidatePath("/profile");
  revalidatePath("/feed");
}
