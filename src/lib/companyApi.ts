import { useQuery } from "@tanstack/react-query";
import {
  normalizeCompanyProfile,
  normalizeCompanySummary,
  normalizeDashboardSkills,
  type CompanyProfile,
  type CompanySummary,
  type DashboardSkill,
} from "@/lib/companyData";
import { requireSupabaseClient } from "@/lib/supabaseClient";

export interface CompanyRecord {
  company_id: number;
  summary: CompanySummary;
  profile: CompanyProfile;
}

export interface CompanySkillsData {
  skills: DashboardSkill[];
  skillTopics: Record<number, string[]>;
}

type CompanyJsonRow = {
  company_id: number;
  short_json: unknown;
  full_json?: unknown;
  // may be a top-level column in the DB
  company_type?: string | null;
  website_url?: string | null;
  headquarters_address?: string | null;
};

type CompanySkillLevelRow = {
  company_id: number;
  skill_set_id: number;
  required_level: number;
  required_proficiency_level_id: number | null;
};

type SkillSetMasterRow = {
  skill_set_id: number;
  skill_set_name: string;
  short_name: string | null;
};

type ProficiencyLevelRow = {
  proficiency_level_id: number;
  proficiency_name: string;
  proficiency_code: string | null;
};

type SkillTopicRow = {
  skill_set_id: number;
  level_number: number;
  topics: unknown;
};

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [String(value).trim()].filter(Boolean);
}

function toTopicText(value: unknown): string {
  const items = asStringList(value);
  return items.length > 0 ? items.join("; ") : "";
}

function ensureCompanySummary(row: CompanyJsonRow): CompanySummary {
  // Merge full_json fields that may be missing from short_json
  const shortData = { ...row.short_json } as Record<string, unknown>;
  const fullData = (row.full_json ?? {}) as Record<string, unknown>;

  // Start with short_json, then fill missing fields from full_json
  const merged: Record<string, unknown> = { ...shortData, company_id: row.company_id };
  const fieldsNeeded: (keyof CompanySummary)[] = [
    "company_type", "website_url", "headquarters_address",
    "incorporation_year", "operating_countries", "office_locations", "yoy_growth_rate",
  ];
  for (const field of fieldsNeeded) {
    if ((merged[field] === undefined || merged[field] === null || merged[field] === "") && fullData[field] != null) {
      merged[field] = fullData[field];
    }
  }

  // Top-level DB columns (if they exist) override everything — highest priority
  if (row.company_type) merged["company_type"] = row.company_type;
  if (row.website_url) merged["website_url"] = row.website_url;
  if (row.headquarters_address) merged["headquarters_address"] = row.headquarters_address;

  return normalizeCompanySummary(merged);
}

function ensureCompanyRecord(row: CompanyJsonRow): CompanyRecord {
  const short = { ...row.short_json, company_id: row.company_id };
  return {
    company_id: row.company_id,
    summary: normalizeCompanySummary(short),
    profile: normalizeCompanyProfile(row.full_json, short),
  };
}

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async (): Promise<CompanySummary[]> => {
      const supabase = requireSupabaseClient();
      // Select * to capture any top-level columns (e.g. company_type stored outside short_json)
      const { data, error } = await supabase
        .from("company_json")
        .select("*")
        .order("company_id", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map((row) => ensureCompanySummary(row as CompanyJsonRow));
    },
  });
}

export function useCompanyProfile(companyId: number | null | undefined) {
  return useQuery({
    queryKey: ["company-profile", companyId],
    enabled: Number.isFinite(companyId ?? NaN),
    queryFn: async (): Promise<CompanyRecord> => {
      const supabase = requireSupabaseClient();
      const { data, error } = await supabase
        .from("company_json")
        .select("company_id, short_json, full_json")
        .eq("company_id", companyId as number)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(`Company ${companyId} was not found in company_json.`);
      }

      return ensureCompanyRecord(data as CompanyJsonRow);
    },
  });
}

export function useCompanySkills(companyId: number | null | undefined) {
  return useQuery({
    queryKey: ["company-skills", companyId],
    enabled: Number.isFinite(companyId ?? NaN),
    queryFn: async (): Promise<CompanySkillsData> => {
      const supabase = requireSupabaseClient();

      const [skillLevelsResult, skillMasterResult, proficiencyResult, skillTopicsResult] = await Promise.all([
        supabase
          .from("company_skill_levels")
          .select("company_id, skill_set_id, required_level, required_proficiency_level_id")
          .eq("company_id", companyId as number)
          .order("skill_set_id", { ascending: true }),
        supabase
          .from("skill_set_master")
          .select("skill_set_id, skill_set_name, short_name")
          .order("skill_set_id", { ascending: true }),
        supabase
          .from("proficiency_levels")
          .select("proficiency_level_id, proficiency_name, proficiency_code")
          .order("proficiency_level_id", { ascending: true }),
        supabase
          .from("skill_set_topics")
          .select("skill_set_id, level_number, topics")
          .order("skill_set_id", { ascending: true })
          .order("level_number", { ascending: true }),
      ]);

      const firstError = [skillLevelsResult, skillMasterResult, proficiencyResult, skillTopicsResult].find(
        (result) => result.error,
      );
      if (firstError?.error) {
        throw firstError.error;
      }

      const skillMasterMap = new Map<number, SkillSetMasterRow>();
      for (const row of skillMasterResult.data ?? []) {
        const entry = row as SkillSetMasterRow;
        skillMasterMap.set(entry.skill_set_id, entry);
      }

      const proficiencyMap = new Map<number, ProficiencyLevelRow>();
      for (const row of proficiencyResult.data ?? []) {
        const entry = row as ProficiencyLevelRow;
        proficiencyMap.set(entry.proficiency_level_id, entry);
      }

      const topicMap = new Map<number, string[]>();
      for (const row of skillTopicsResult.data ?? []) {
        const entry = row as SkillTopicRow;
        const existing = topicMap.get(entry.skill_set_id) ?? Array.from({ length: 10 }, () => "");
        existing[entry.level_number - 1] = toTopicText(entry.topics);
        topicMap.set(entry.skill_set_id, existing);
      }

      const normalizedSkills = (skillLevelsResult.data ?? []).map((row) => {
        const skill = row as CompanySkillLevelRow;
        const master = skillMasterMap.get(skill.skill_set_id);
        const proficiency = skill.required_proficiency_level_id
          ? proficiencyMap.get(skill.required_proficiency_level_id)
          : undefined;

        return {
          skill_set_id: skill.skill_set_id,
          skill_set_name: master?.skill_set_name ?? master?.short_name ?? `Skill ${skill.skill_set_id}`,
          required_level: skill.required_level,
          required_proficiency: proficiency?.proficiency_name ?? proficiency?.proficiency_code ?? "",
        };
      });

      return {
        skills: normalizeDashboardSkills(normalizedSkills),
        skillTopics: Object.fromEntries(topicMap.entries()),
      };
    },
  });
}