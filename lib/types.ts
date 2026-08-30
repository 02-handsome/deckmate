export type UserRole =
  | "structurer"
  | "analyst"
  | "storyteller"
  | "financial_planner";

export type WorkStyle = "early_riser" | "night_owl" | "flexible";

export type CompType =
  | "strategy_growth"
  | "marketing_brand"
  | "finance"
  | "operations";

export type RequestStatus = "open" | "filled" | "closed" | "expired";
export type ApplicationStatus = "pending" | "accepted" | "declined";

/**
 * A user as the rest of the app is allowed to see one.
 *
 * `contact_handle` and `email` are deliberately absent from this type.
 * The database will not return them through the table either — see the
 * column grants in supabase/01_schema.sql. The type and the grant say
 * the same thing, so a mistake in the app is caught by the compiler and
 * a mistake in the query is caught by Postgres.
 */
export type PublicUser = {
  id: string;
  name: string;
  year: number;
  section: string | null;
  role: UserRole;
  work_style: WorkStyle;
  skills: string[];
  credibility_line: string | null;
  avatar_url: string | null;
  reliability_score: number | null;
  ratings_given_count: number;
  created_at: string;
};

/** Only ever produced by get_my_profile() or get_team_contacts(). */
export type ContactBearing = PublicUser & { contact_handle: string };

export type TeamContact = {
  user_id: string;
  name: string;
  contact_handle: string;
};

export type CaseRequest = {
  id: string;
  author_id: string;
  comp_name: string;
  comp_type: CompType;
  skills_needed: string[];
  roles_needed: UserRole[];
  team_size: number;
  deadline: string;
  status: RequestStatus;
  created_at: string;
};

export type RequestWithAuthor = CaseRequest & { author: PublicUser };

export type Application = {
  id: string;
  request_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  created_at: string;
};

export const ROLE_LABEL: Record<UserRole, string> = {
  structurer: "Structurer",
  analyst: "Analyst",
  storyteller: "Storyteller",
  financial_planner: "Financial Planner",
};

export const WORK_STYLE_LABEL: Record<WorkStyle, string> = {
  early_riser: "Early riser",
  night_owl: "Night owl",
  flexible: "Flexible",
};

export const COMP_TYPE_LABEL: Record<CompType, string> = {
  strategy_growth: "Strategy & Growth",
  marketing_brand: "Marketing & Brand",
  finance: "Finance",
  operations: "Operations",
};

export const ROLES = Object.keys(ROLE_LABEL) as UserRole[];
export const WORK_STYLES = Object.keys(WORK_STYLE_LABEL) as WorkStyle[];
export const COMP_TYPES = Object.keys(COMP_TYPE_LABEL) as CompType[];

/** The skill vocabulary. Free-text search is explicitly not being built. */
export const SKILLS = [
  "Financial Modeling",
  "Valuation",
  "Unit Economics",
  "Pricing",
  "Van Westendorp",
  "Excel",
  "Market Analysis",
  "Market Sizing",
  "Market Entry",
  "Competitive Intel",
  "Data Analytics",
  "SQL",
  "Python",
  "Tableau",
  "Consumer Research",
  "Primary Research",
  "Survey Design",
  "JTBD",
  "Semiotics",
  "Brand Strategy",
  "Go-to-Market",
  "Storytelling",
  "Slide Design",
  "Pitching",
  "Public Speaking",
  "Copywriting",
  "Issue Trees",
  "SWOT",
  "Porter Five Forces",
  "Operations",
  "Supply Chain",
  "Process Design",
  "Sustainability",
] as const;
