import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  normalizeCompanyProfile,
  normalizeCompanySummary,
  normalizeDashboardSkills,
  type CompanyProfile,
  type CompanySummary,
  type DashboardSkill,
} from "@/lib/companyData";
import { requireSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Groq from "groq-sdk";
import { createServerFn } from "@tanstack/react-start";

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

export function useBatchStats() {
  return useQuery({
    queryKey: ["batch-stats"],
    queryFn: async () => {
      const supabase = requireSupabaseClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("placement_status, package_lpa");

      if (error) throw error;

      const totalStudents = data?.length ?? 0;
      const placedCount = data?.filter((d: any) => d.placement_status === "placed").length ?? 0;
      const pendingCount = totalStudents - placedCount;

      const packages = data
        ?.filter((d: any) => d.placement_status === "placed" && Number(d.package_lpa) > 0)
        .map((d: any) => Number(d.package_lpa)) ?? [];

      const highestSalary = packages.length > 0 ? Math.max(...packages) : 0;
      const avgSalary = packages.length > 0
        ? Number((packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1))
        : 0;

      return {
        totalStudents,
        placedCount,
        pendingCount,
        highestSalary: highestSalary > 0 ? `${highestSalary} LPA` : "0 LPA",
        avgSalary: avgSalary > 0 ? `${avgSalary} LPA` : "0 LPA",
      };
    },
  });
}

export function useBatchSkills() {
  return useQuery({
    queryKey: ["batch-skills"],
    queryFn: async () => {
      const supabase = requireSupabaseClient();

      const [studentsRes, companyRes, skillMasterRes] = await Promise.all([
        supabase.from("student_skills").select("skill_set_name, current_level"),
        supabase.from("company_skill_levels").select("skill_set_id, required_level"),
        supabase.from("skill_set_master").select("skill_set_id, skill_set_name, short_name"),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (companyRes.error) throw companyRes.error;
      if (skillMasterRes.error) throw skillMasterRes.error;

      const studentGroups: Record<string, number[]> = {};
      for (const row of studentsRes.data ?? []) {
        const name = String(row.skill_set_name);
        studentGroups[name] = studentGroups[name] ?? [];
        studentGroups[name].push(Number(row.current_level));
      }

      const masterMap = new Map<number, string>();
      for (const row of skillMasterRes.data ?? []) {
        masterMap.set(row.skill_set_id, row.skill_set_name ?? row.short_name);
      }

      const companyGroups: Record<string, number[]> = {};
      for (const row of companyRes.data ?? []) {
        const name = masterMap.get(row.skill_set_id) ?? `Skill ${row.skill_set_id}`;
        companyGroups[name] = companyGroups[name] ?? [];
        companyGroups[name].push(Number(row.required_level));
      }

      const skillNames = Array.from(new Set([
        ...Object.keys(studentGroups),
        ...Object.keys(companyGroups),
      ]));

      return skillNames.map((name) => {
        const studentVals = studentGroups[name] ?? [];
        const companyVals = companyGroups[name] ?? [];

        const studentAvg = studentVals.length > 0
          ? Number((studentVals.reduce((a, b) => a + b, 0) / studentVals.length).toFixed(1))
          : 0;

        const requiredAvg = companyVals.length > 0
          ? Number((companyVals.reduce((a, b) => a + b, 0) / companyVals.length).toFixed(1))
          : 0;

        return {
          name,
          studentAvg,
          requiredAvg: requiredAvg || 5.0,
        };
      });
    },
  });
}

export interface HiringDrive {
  id: string;
  company_id: number;
  title: string;
  eligibility: string;
  ctc: string;
  deadline: string;
  description: string;
  created_at: string;
  company?: CompanySummary;
}

export function useHiringDrives() {
  return useQuery({
    queryKey: ["hiring-drives"],
    queryFn: async (): Promise<HiringDrive[]> => {
      const supabase = requireSupabaseClient();
      const { data, error } = await supabase
        .from("hiring_drives")
        .select("*, company_json(short_json)")
        .order("deadline", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row: any) => {
        const short = row.company_json
          ? { ...row.company_json.short_json as Record<string, unknown>, company_id: row.company_id }
          : null;
        return {
          id: row.id,
          company_id: row.company_id,
          title: row.title,
          eligibility: row.eligibility,
          ctc: row.ctc,
          deadline: row.deadline,
          description: row.description,
          created_at: row.created_at,
          company: short ? normalizeCompanySummary(short) : undefined,
        };
      });
    },
  });
}

export function useDriveRegistrations(driveId: string | null | undefined) {
  return useQuery({
    queryKey: ["drive-registrations", driveId],
    enabled: !!driveId,
    queryFn: async () => {
      const supabase = requireSupabaseClient();
      const { data, error } = await supabase
        .from("drive_registrations")
        .select("*, profiles(full_name, email)")
        .eq("drive_id", driveId as string);

      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        registered_at: row.registered_at,
        student_id: row.student_id,
        full_name: row.profiles?.full_name ?? "Unknown",
        email: row.profiles?.email ?? "Unknown",
      }));
    },
  });
}

export function useStudentRegistrations(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ["student-registrations", studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<string[]> => {
      const supabase = requireSupabaseClient();
      const { data, error } = await supabase
        .from("drive_registrations")
        .select("drive_id")
        .eq("student_id", studentId as string);

      if (error) throw error;
      return (data ?? []).map((row: any) => String(row.drive_id));
    },
  });
}

export function useRegisterForDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ driveId, studentId }: { driveId: string; studentId: string }) => {
      const supabase = requireSupabaseClient();
      const { error } = await supabase
        .from("drive_registrations")
        .insert({ drive_id: driveId, student_id: studentId });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student-registrations", variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ["drive-registrations", variables.driveId] });
    },
  });
}

export function useUnregisterFromDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ driveId, studentId }: { driveId: string; studentId: string }) => {
      const supabase = requireSupabaseClient();
      const { error } = await supabase
        .from("drive_registrations")
        .delete()
        .eq("drive_id", driveId)
        .eq("student_id", studentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student-registrations", variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ["drive-registrations", variables.driveId] });
    },
  });
}

export function useCreateHiringDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (drive: Omit<HiringDrive, "id" | "created_at">) => {
      const supabase = requireSupabaseClient();
      const { error } = await supabase
        .from("hiring_drives")
        .insert({
          company_id: drive.company_id,
          title: drive.title,
          eligibility: drive.eligibility,
          ctc: drive.ctc,
          deadline: drive.deadline,
          description: drive.description,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hiring-drives"] });
    },
  });
}

export interface CompanyReadinessData {
  readiness_percentage: number;
  total_required_level: number;
  student_earned_level: number;
  mastered_skills: string[];
  needs_attention_skills: string[];
}

export function useCompanyReadiness(companyId: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["company-readiness", companyId, user?.id],
    enabled: !!companyId && !!user?.id,
    queryFn: async (): Promise<CompanyReadinessData> => {
      const supabase = requireSupabaseClient();
      const { data, error } = await supabase.rpc("calculate_company_readiness", {
        target_company_id: companyId,
        target_student_id: user?.id,
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        return {
          readiness_percentage: 0,
          total_required_level: 0,
          student_earned_level: 0,
          mastered_skills: [],
          needs_attention_skills: [],
        };
      }

      const row = data[0];
      return {
        readiness_percentage: Number(row.readiness_percentage),
        total_required_level: Number(row.total_required_level),
        student_earned_level: Number(row.student_earned_level),
        mastered_skills: Array.isArray(row.mastered_skills) ? row.mastered_skills : [],
        needs_attention_skills: Array.isArray(row.needs_attention_skills) ? row.needs_attention_skills : [],
      };
    },
  });
}

export function useUpdateOnboarding() {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      packageLpa,
      batchYear,
      targetRole,
      skills,
    }: {
      packageLpa: number;
      batchYear: number;
      targetRole: string;
      skills: Array<{ skillName: string; level: number }>;
    }) => {
      if (!user?.id) throw new Error("User is not authenticated");
      const supabase = requireSupabaseClient();

      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          package_lpa: packageLpa,
          batch_year: batchYear,
          placement_status: "pending",
          target_role: targetRole,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2. Upsert student_skills table
      const skillUpserts = skills.map((s) => ({
        student_id: user.id,
        skill_set_name: s.skillName,
        current_level: s.level,
        updated_at: new Date().toISOString(),
      }));

      const { error: skillsError } = await supabase
        .from("student_skills")
        .upsert(skillUpserts, { onConflict: "student_id,skill_set_name" });

      if (skillsError) throw skillsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-skills"] });
      queryClient.invalidateQueries({ queryKey: ["batch-stats"] });
      queryClient.invalidateQueries({ queryKey: ["company-readiness"] });
      refreshProfile();
    },
  });
}

export function useAvailableRoles() {
  return useQuery({
    queryKey: ["available-roles"],
    queryFn: async (): Promise<string[]> => {
      const supabase = requireSupabaseClient();
      const { data, error } = await supabase
        .from("hiring_drives")
        .select("title");

      if (error) throw error;
      const roles = (data ?? []).map((row: any) => String(row.title));
      return Array.from(new Set(roles));
    },
  });
}

export interface SkillMaster {
  skill_set_id: number;
  skill_set_name: string;
  short_name: string | null;
}

export function useSkillsMaster() {
  return useQuery({
    queryKey: ["skills-master"],
    queryFn: async (): Promise<SkillMaster[]> => {
      const supabase = requireSupabaseClient();
      const { data, error } = await supabase
        .from("skill_set_master")
        .select("skill_set_id, skill_set_name, short_name")
        .order("skill_set_id", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}

function flattenGlobalData(companies: any[], drives: any[], statsObj: any): string {
  const totalStudents = Number(statsObj?.total_students || 0);
  const placedCount = Number(statsObj?.placed_count || 0);
  const avgSalary = Number(statsObj?.average_lpa || 0).toFixed(1);

  let companyListStr = "";
  if (companies && companies.length > 0) {
    companyListStr = companies.map(c => `- ${c.name} (${c.category || "N/A"} Category) | HQ: ${c.headquarters_address || "N/A"} | URL: ${c.website_url || "N/A"}`).join("\n");
  } else {
    companyListStr = "No company records currently in database directory.";
  }

  let driveListStr = "";
  if (drives && drives.length > 0) {
    driveListStr = drives.map(d => `- Drive: ${d.title} | CTC Package: ${d.ctc || "N/A"} | Apply Deadline: ${d.deadline || "N/A"} | Eligibility: ${d.eligibility || "N/A"}`).join("\n");
  } else {
    driveListStr = "No active placement drives currently open.";
  }

  return `
KITS Placement Statistics:
- Total Enrolled Students: ${totalStudents}
- Placed Student Count: ${placedCount}
- Placement Ratio: ${totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0}%
- Average Placed Package: ${avgSalary} LPA

Registered Corporations Directory:
${companyListStr}

Open Hiring Drives & Timelines:
${driveListStr}
`;
}

export const sendGlobalGeminiChat = createServerFn({ method: "POST" })
  .validator((data: { message: string; history?: Array<{ role: string; text: string }> }) => data)
  .handler(async ({ data: { message, history } }) => {
    try {
      const supabase = requireSupabaseClient();
      
      // 1. Fetch directory lists and stats (try RPC first, fallback to direct query)
      const [companiesRes, drivesRes] = await Promise.all([
        supabase.from("companies").select("name, category, headquarters_address, website_url"),
        supabase.from("hiring_drives").select("title, ctc, deadline, eligibility"),
      ]);

      if (companiesRes.error) throw companiesRes.error;
      if (drivesRes.error) throw drivesRes.error;

      // Try the security-definer RPC first; if not deployed yet, fall back to raw query
      let statsObj: any = {};
      const rpcRes = await supabase.rpc("get_placement_stats");
      if (!rpcRes.error && rpcRes.data) {
        statsObj = rpcRes.data?.[0] || {};
      } else {
        // Fallback: direct query (may return 0 rows due to RLS if anon)
        console.warn("get_placement_stats RPC not available, using direct query:", rpcRes.error?.message);
        const profilesRes = await supabase.from("profiles").select("placement_status, package_lpa");
        const rows = profilesRes.data ?? [];
        const placed = rows.filter((r: any) => r.placement_status === "placed");
        const pkgs = placed.map((r: any) => Number(r.package_lpa)).filter((n: number) => n > 0);
        statsObj = {
          total_students: rows.length,
          placed_count: placed.length,
          average_lpa: pkgs.length > 0 ? (pkgs.reduce((a: number, b: number) => a + b, 0) / pkgs.length).toFixed(1) : 0,
        };
      }

      const contextStr = flattenGlobalData(companiesRes.data ?? [], drivesRes.data ?? [], statsObj);

      // 2. Initialize Groq client
      // VITE_-prefixed vars are reliably injected into import.meta.env in Vite SSR.
      const apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY
        || (import.meta as any).env?.GROQ_API_KEY
        || process.env.VITE_GROQ_API_KEY
        || process.env.GROQ_API_KEY;
      console.log("SERVER sendGlobalChat GROQ KEY CHECK:", apiKey ? `FOUND (length ${apiKey.length}, starts: ${apiKey.slice(0,8)})` : "NOT FOUND");
      if (!apiKey) {
        throw new Error("GROQ_API_KEY not found. Make sure VITE_GROQ_API_KEY is set in your .env file and restart the dev server.");
      }
      const groq = new Groq({ apiKey });

      // 3. System prompt
      const systemPrompt = `You are the official KITS Placement Navigator Assistant at Karunya Institute of Technology and Sciences. You are an expert placement counselor. Use the following context directory to answer the student's question accurately:
${contextStr}
Guidelines:
1. Base your technical, financial, and active drive details ONLY on the provided database context.
2. If the user asks a question whose details are missing from this context, reply gracefully: 'I don't have that specific detail in my database yet, but I highly recommend checking directly with the KITS Placement Cell.'
3. Keep answers concise, helpful for engineering students seeking campus placements, formatted with bullet points, and highly professional. Never break character.`;

      // 4. Build OpenAI-compatible message array for Groq
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
      ];
      if (history) {
        for (const msg of history) {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text,
          });
        }
      }
      messages.push({ role: "user", content: message });

      // 5. Generate reply via Groq
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const text = completion.choices[0]?.message?.content || "No response text generated.";
      return { text };
    } catch (err: any) {
      console.error("SERVER sendGlobalChat GROQ ERROR:", err);
      return { error: parseGroqError(err) };
    }
  });

/** Converts raw Groq / API errors into short, human-readable messages */
function parseGroqError(err: any): string {
  const raw = err?.message || String(err);
  if (err?.status === 429 || raw.toLowerCase().includes("rate limit") || raw.toLowerCase().includes("quota")) {
    return "The AI service is temporarily rate-limited. Please wait a moment and try again.";
  }
  if (err?.status === 401 || raw.toLowerCase().includes("api key") || raw.toLowerCase().includes("auth")) {
    return "Invalid Groq API key. Please update VITE_GROQ_API_KEY in your .env file.";
  }
  if (err?.status === 503 || raw.toLowerCase().includes("unavailable")) {
    return "The AI service is temporarily unavailable. Please try again in a moment.";
  }
  return raw;
}

export function flattenCompanyData(company: any): string {
  if (!company) return "No specific context details found for this company in database.";

  const culture = company.company_culture?.[0] || {};
  const financials = company.company_financials?.[0] || {};
  const techData = company.company_technologies?.[0] || {};
  const techStack = techData.company_tech_stack?.[0]?.tech_stack || "N/A";

  return `
Company Profile: ${company.name || "N/A"} (${company.short_name || "N/A"})
- Category: ${company.category || "N/A"}
- Incorporation Year: ${company.incorporation_year || "N/A"}
- Headquarters: ${company.headquarters_address || "N/A"}
- Office Count: ${company.office_count || "N/A"}
- Scale Size: ${company.employee_size || "N/A"}
- Overview: ${company.overview_text || "N/A"}
- Vision: ${company.vision_statement || "N/A"}
- Mission: ${company.mission_statement || "N/A"}

Financials:
- Annual Revenue: ${financials.annual_revenue || "N/A"}
- Annual Profit: ${financials.annual_profit || "N/A"}
- Valuation: ${financials.valuation || "N/A"}
- YoY Growth Rate: ${financials.yoy_growth_rate || "N/A"}
- Profitability Status: ${financials.profitability_status || "N/A"}
- Total Capital Raised: ${financials.total_capital_raised || "N/A"}

Culture & Work Environment:
- Employee Turnover: ${culture.employee_turnover || "N/A"}
- Avg Retention Tenure: ${culture.avg_retention_tenure || "N/A"}
- Layoff History: ${culture.layoff_history || "N/A"}
- Manager Quality: ${culture.manager_quality || "N/A"}
- Psychological Safety: ${culture.psychological_safety || "N/A"}
- Burnout Risk: ${culture.burnout_risk || "N/A"}

Technology:
- Tech Stack: ${techStack}
- AI/ML Adoption Level: ${techData.ai_ml_adoption_level || "N/A"}
- R&D Investment: ${techData.r_and_d_investment || "N/A"}
`;
}

export const sendCompanyGeminiChat = createServerFn({ method: "POST" })
  .validator((data: { companyId: number; message: string; history?: Array<{ role: string; text: string }> }) => data)
  .handler(async ({ data: { companyId, message, history } }) => {
    try {
      const supabase = requireSupabaseClient();
      const { data: company } = await supabase
        .from("companies")
        .select(`
          *,
          company_culture (*),
          company_financials (*),
          company_technologies (
            *,
            company_tech_stack (*)
          )
        `)
        .eq("company_id", companyId)
        .maybeSingle();

      const contextStr = flattenCompanyData(company);

      // Initialize Groq client
      const apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY
        || (import.meta as any).env?.GROQ_API_KEY
        || process.env.VITE_GROQ_API_KEY
        || process.env.GROQ_API_KEY;
      console.log("SERVER sendCompanyChat GROQ KEY CHECK:", apiKey ? `FOUND (length ${apiKey.length}, starts: ${apiKey.slice(0,8)})` : "NOT FOUND");
      if (!apiKey) {
        throw new Error("GROQ_API_KEY not found. Make sure VITE_GROQ_API_KEY is set in your .env file and restart the dev server.");
      }
      const groq = new Groq({ apiKey });

      const systemPrompt = `You are the official KITS Placement Prep Coach for ${company?.name || "this company"}. You are an expert placement counselor and advisor. Use the following company context to answer the student's question accurately:
${contextStr}
Guidelines:
1. Base your technical, financial, and culture details strictly on the provided company database context.
2. Answer the student's query regarding preparing for interviews, coding rounds, or specific topics for this company.
3. Keep answers concise, helpful for engineering students, formatted with bullet points, and highly professional. Never break character.`;

      // Build OpenAI-compatible message array for Groq
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
      ];
      if (history) {
        for (const msg of history) {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text,
          });
        }
      }
      messages.push({ role: "user", content: message });

      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const text = completion.choices[0]?.message?.content || "No response text generated.";
      return { text };
    } catch (err: any) {
      console.error("SERVER sendCompanyChat GROQ ERROR:", err);
      return { error: parseGroqError(err) };
    }
  });