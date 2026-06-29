export interface CompanySummary {
  company_id: number;
  name: string;
  short_name: string;
  logo_url: string;
  category: string;
  company_type: string;
  incorporation_year: number | string;
  employee_size: string;
  headquarters_address: string;
  operating_countries: string;
  office_locations: string;
  yoy_growth_rate: string;
  website_url: string;
}

export interface CompanyProfile extends CompanySummary {
  [key: string]: unknown;
}

export interface DashboardSkill {
  skill_set_id: number;
  skill_set_name: string;
  required_level: number;
  required_proficiency: string;
  bloom: "CU" | "AP" | "AS" | "EV" | "CR";
  criticality: "Critical" | "Important" | "Baseline";
  difficulty: "EXPERT" | "ADVANCED" | "PRO" | "BEGINNER";
}

export const asString = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  return String(v);
};

export const asRecord = (v: unknown): Record<string, unknown> => {
  if (v && typeof v === "object") return v as Record<string, unknown>;
  return {};
};

const NULLISH = new Set(["", "na", "n/a", "none", "-", "null", "undefined"]);
export const isNullish = (v: unknown): boolean =>
  NULLISH.has(asString(v).trim().toLowerCase());

export const splitItems = (v: string): string[] =>
  v
    .split(/[\n;•]|(?<=[a-z0-9\)])\.\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

export const titleCaseFromCode = (s: string): string =>
  s
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const scoreToDifficulty = (
  score: number,
): DashboardSkill["difficulty"] => {
  if (score >= 8) return "EXPERT";
  if (score >= 6) return "ADVANCED";
  if (score >= 4) return "PRO";
  return "BEGINNER";
};

export const proficiencyToBloom = (level: number): DashboardSkill["bloom"] => {
  if (level <= 2) return "CU";
  if (level <= 4) return "AP";
  if (level <= 6) return "AS";
  if (level <= 8) return "EV";
  return "CR";
};

export const scoreToCriticality = (
  score: number,
): DashboardSkill["criticality"] => {
  if (score >= 7) return "Critical";
  if (score >= 5) return "Important";
  return "Baseline";
};

export function normalizeCompanySummary(short: unknown): CompanySummary {
  const s = asRecord(short);
  return {
    company_id: Number(s.company_id ?? 0),
    name: asString(s.name),
    short_name: asString(s.short_name),
    logo_url: asString(s.logo_url),
    category: asString(s.category),
    company_type: asString(s.company_type),
    incorporation_year: (s.incorporation_year as number | string) ?? "",
    employee_size: asString(s.employee_size),
    headquarters_address: asString(s.headquarters_address),
    operating_countries: asString(s.operating_countries),
    office_locations: asString(s.office_locations),
    yoy_growth_rate: asString(s.yoy_growth_rate),
    website_url: asString(s.website_url),
  };
}

export function normalizeCompanyProfile(
  full: unknown,
  short: unknown,
): CompanyProfile {
  const summary = normalizeCompanySummary(short);
  const f = asRecord(full);
  return { ...summary, ...f } as CompanyProfile;
}

export function normalizeDashboardSkills(rows: unknown[]): DashboardSkill[] {
  return rows.map((row) => {
    const r = asRecord(row);
    const level = Number(r.required_level ?? 0);
    return {
      skill_set_id: Number(r.skill_set_id ?? 0),
      skill_set_name: asString(r.skill_set_name),
      required_level: level,
      required_proficiency: asString(r.required_proficiency),
      bloom: proficiencyToBloom(level),
      criticality: scoreToCriticality(level),
      difficulty: scoreToDifficulty(level),
    };
  });
}

export function loadSeedCompanies(seed: unknown[]) {
  return seed.map((entry) => {
    const e = asRecord(entry);
    const company_id = Number(e.company_id ?? 0);
    const short = { ...asRecord(e.short_json), company_id };
    const full = asRecord(e.full_json);
    const skills = Array.isArray(e.skill_levels) ? e.skill_levels : [];
    return {
      company_id,
      summary: normalizeCompanySummary(short),
      profile: normalizeCompanyProfile(full, short),
      skills: normalizeDashboardSkills(skills),
    };
  });
}
