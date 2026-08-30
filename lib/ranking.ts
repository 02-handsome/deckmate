import type { PublicUser, RequestWithAuthor } from "./types";

/**
 * Feed ranking — Phase 5.
 *
 * Four terms, weighted, out of 100. The weighting is a product decision
 * and you should be able to defend it:
 *
 *   Role complementarity (40) — highest, because a balanced team is the
 *     thing the PRD says Deckmate exists to produce. A request that needs
 *     your role is more valuable to you than one that merely matches your
 *     skills, since the skills of a fourth Analyst are already covered.
 *
 *   Skill overlap (30) — second, because it is what the author actually
 *     asked for. Scored as a fraction of what they need, not a raw count,
 *     so a request asking for two skills you both have beats one asking
 *     for six of which you have two.
 *
 *   Work-style fit (15) — PRD section 3. Cheap to compute and it is the
 *     documented source of friction in 24-hour live cracks.
 *
 *   Deadline proximity (15) — urgency, not quality. Deliberately the
 *     smallest term: a soon deadline should break a tie between two good
 *     matches, never promote a bad one.
 */
export const WEIGHTS = {
  role: 40,
  skills: 30,
  workStyle: 15,
  deadline: 15,
} as const;

export type ScoredRequest = RequestWithAuthor & {
  score: number;
  reasons: string[];
};

export function scoreRequest(
  request: RequestWithAuthor,
  viewer: PublicUser,
): ScoredRequest {
  const reasons: string[] = [];
  let score = 0;

  // Role complementarity — does this team have a hole shaped like you?
  if (request.roles_needed.includes(viewer.role)) {
    score += WEIGHTS.role;
    reasons.push("Needs your role");
  }

  // Skill overlap, as a fraction of what was asked for.
  const needed = request.skills_needed;
  if (needed.length > 0) {
    const mine = new Set(viewer.skills);
    const hits = needed.filter((s) => mine.has(s));
    if (hits.length > 0) {
      score += WEIGHTS.skills * (hits.length / needed.length);
      reasons.push(
        hits.length === needed.length
          ? "Every skill they need"
          : `${hits.length} of ${needed.length} skills`,
      );
    }
  }

  // Work-style fit. "Flexible" on either side is a fit, not a mismatch.
  const a = request.author.work_style;
  const b = viewer.work_style;
  if (a === b || a === "flexible" || b === "flexible") {
    score += WEIGHTS.workStyle;
    if (a === b && a !== "flexible") reasons.push("Same work style");
  }

  // Deadline proximity: full marks inside a week, tapering to zero at 30 days.
  const days = daysUntil(request.deadline);
  if (days >= 0) {
    const proximity = days <= 7 ? 1 : Math.max(0, (30 - days) / 23);
    score += WEIGHTS.deadline * proximity;
    if (days <= 3) reasons.push(days <= 1 ? "Closes today" : "Closing soon");
  }

  return { ...request, score: Math.round(score), reasons };
}

export function rankRequests(
  requests: RequestWithAuthor[],
  viewer: PublicUser,
): ScoredRequest[] {
  return requests
    .map((r) => scoreRequest(r, viewer))
    .sort((a, b) => b.score - a.score || daysUntil(a.deadline) - daysUntil(b.deadline));
}

export function daysUntil(deadline: string): number {
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export function deadlineLabel(deadline: string): string {
  const d = daysUntil(deadline);
  if (d < 0) return `Closed ${Math.abs(d)}d ago`;
  if (d === 0) return "Closes today";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}
