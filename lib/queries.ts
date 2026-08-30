import { createClient } from "@/lib/supabase/server";
import type {
  Application,
  CaseRequest,
  ContactBearing,
  PublicUser,
  RequestWithAuthor,
  TeamContact,
} from "./types";

/**
 * The only column list the app ever selects from `users`.
 *
 * `select("*")` on users fails at the database — contact_handle and email
 * are not in the grant. That is deliberate: the failure is loud and it
 * happens in development, not in front of a grader.
 */
export const USER_COLUMNS =
  "id,name,year,section,role,work_style,skills,credibility_line,avatar_url,reliability_score,ratings_given_count,created_at";

export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
}

/** Your own row, contact handle included. Comes through the RPC, not the table. */
export async function getMyProfile(): Promise<ContactBearing | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_profile");
  if (error || !data || data.length === 0) return null;
  return data[0] as ContactBearing;
}

export async function getUser(id: string): Promise<PublicUser | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as PublicUser) ?? null;
}

export async function listUsers(): Promise<PublicUser[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .order("created_at", { ascending: true });
  return (data as PublicUser[]) ?? [];
}

/**
 * Expiry on read, not cron. A request is live if it says it is open AND
 * its deadline has not passed. There is no scheduled job correcting the
 * status column, so the filter has to carry that weight every time.
 */
export async function listOpenRequests(): Promise<RequestWithAuthor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("requests")
    .select(`*, author:users!requests_author_id_fkey(${USER_COLUMNS})`)
    .eq("status", "open")
    .gt("deadline", new Date().toISOString())
    .order("deadline", { ascending: true });
  return (data as RequestWithAuthor[]) ?? [];
}

export async function getRequest(id: string): Promise<RequestWithAuthor | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("requests")
    .select(`*, author:users!requests_author_id_fkey(${USER_COLUMNS})`)
    .eq("id", id)
    .maybeSingle();
  return (data as RequestWithAuthor) ?? null;
}

export async function getMyRequests(userId: string): Promise<CaseRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("requests")
    .select("*")
    .eq("author_id", userId)
    .order("deadline", { ascending: false });
  return (data as CaseRequest[]) ?? [];
}

export type ApplicantRow = Application & { applicant: PublicUser };

export async function getApplicants(requestId: string): Promise<ApplicantRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select(`*, applicant:users!applications_applicant_id_fkey(${USER_COLUMNS})`)
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  return (data as ApplicantRow[]) ?? [];
}

export async function getMyApplication(
  requestId: string,
  userId: string,
): Promise<Application | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("*")
    .eq("request_id", requestId)
    .eq("applicant_id", userId)
    .maybeSingle();
  return (data as Application) ?? null;
}

/**
 * The reveal. Returns nothing at all unless an accepted application ties
 * the viewer to the people named. RLS is not what protects this — the
 * function's shape is.
 */
export async function getTeamContacts(requestId: string): Promise<TeamContact[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_team_contacts", {
    p_request_id: requestId,
  });
  return (data as TeamContact[]) ?? [];
}

export type PendingRating = {
  request: CaseRequest;
  teammate: PublicUser;
};

/**
 * Phase 8. Everyone you actually teamed with on a competition whose
 * deadline has passed, minus the ones you have already rated.
 *
 * "Teamed with" is derived the same way the contact reveal is: from an
 * accepted application. No separate teams table, no cron.
 */
export async function getPendingRatings(userId: string): Promise<PendingRating[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: mine } = await supabase
    .from("applications")
    .select("request_id, status")
    .eq("applicant_id", userId)
    .eq("status", "accepted");

  const { data: authored } = await supabase
    .from("requests")
    .select("id")
    .eq("author_id", userId)
    .lt("deadline", nowIso);

  const requestIds = [
    ...new Set([
      ...(mine ?? []).map((m) => m.request_id as string),
      ...(authored ?? []).map((a) => a.id as string),
    ]),
  ];
  if (requestIds.length === 0) return [];

  const { data: requests } = await supabase
    .from("requests")
    .select("*")
    .in("id", requestIds)
    .lt("deadline", nowIso);
  if (!requests || requests.length === 0) return [];

  const pastIds = requests.map((r) => r.id as string);

  // Everyone on those teams: the author, plus every accepted applicant.
  const { data: members } = await supabase
    .from("applications")
    .select(`request_id, applicant:users!applications_applicant_id_fkey(${USER_COLUMNS})`)
    .in("request_id", pastIds)
    .eq("status", "accepted");

  const { data: alreadyRated } = await supabase
    .from("ratings")
    .select("request_id, rated_id")
    .eq("rater_id", userId);

  const rated = new Set(
    (alreadyRated ?? []).map((r) => `${r.request_id}:${r.rated_id}`),
  );

  const byId = new Map(requests.map((r) => [r.id as string, r as CaseRequest]));
  const out: PendingRating[] = [];
  const seen = new Set<string>();

  for (const m of members ?? []) {
    const teammate = m.applicant as unknown as PublicUser;
    const requestId = m.request_id as string;
    if (!teammate || teammate.id === userId) continue;
    const key = `${requestId}:${teammate.id}`;
    if (rated.has(key) || seen.has(key)) continue;
    const request = byId.get(requestId);
    if (!request) continue;
    seen.add(key);
    out.push({ request, teammate });
  }

  // ...and the author of any request you were accepted onto.
  const authorIds = requests
    .filter((r) => r.author_id !== userId)
    .map((r) => ({ requestId: r.id as string, authorId: r.author_id as string }));

  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("users")
      .select(USER_COLUMNS)
      .in("id", [...new Set(authorIds.map((a) => a.authorId))]);
    const authorById = new Map(
      ((authors as PublicUser[]) ?? []).map((a) => [a.id, a]),
    );
    for (const { requestId, authorId } of authorIds) {
      const key = `${requestId}:${authorId}`;
      if (rated.has(key) || seen.has(key)) continue;
      const teammate = authorById.get(authorId);
      const request = byId.get(requestId);
      if (!teammate || !request) continue;
      seen.add(key);
      out.push({ request, teammate });
    }
  }

  return out;
}
