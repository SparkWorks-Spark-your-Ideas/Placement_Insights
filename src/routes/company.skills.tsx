import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { CompanyLogo } from "@/components/CompanyLogo";
import { useCompanySkills } from "@/lib/companyApi";
import type { DashboardSkill } from "@/lib/companyData";

export const Route = createFileRoute("/company/skills")({
  component: SkillIntelligence,
});

const BLOOM_LABEL: Record<DashboardSkill["bloom"], string> = {
  CU: "CU · Understand",
  AP: "AP · Apply",
  AS: "AS · Analyze",
  EV: "EV · Evaluate",
  CR: "CR · Create",
};

const BLOOM_BG: Record<DashboardSkill["bloom"], string> = {
  CU: "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30",
  AP: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30",
  AS: "bg-[#eab308]/10 text-[#a16207] border-[#eab308]/30",
  EV: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30",
  CR: "bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/30",
};

const BLOOM_BAR: Record<DashboardSkill["bloom"], string> = {
  CU: "bg-[#3b82f6]",
  AP: "bg-[#22c55e]",
  AS: "bg-[#eab308]",
  EV: "bg-[#ef4444]",
  CR: "bg-[#a855f7]",
};

const CRIT_STYLE: Record<DashboardSkill["criticality"], string> = {
  Critical: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30",
  Important: "bg-[#d97706]/10 text-[#d97706] border-[#d97706]/30",
  Baseline: "bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/30",
};

function SkillCard({ skill, topics }: { skill: DashboardSkill; topics: string[] }) {
  const [open, setOpen] = useState(false);
  const pct = (skill.required_level / 10) * 100;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold text-foreground">{skill.skill_set_name}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${BLOOM_BG[skill.bloom]}`}>
              {BLOOM_LABEL[skill.bloom]}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CRIT_STYLE[skill.criticality]}`}>
              {skill.criticality}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-heading text-xl font-bold text-foreground">{skill.required_level}<span className="text-sm text-muted-foreground">/10</span></div>
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${BLOOM_BAR[skill.bloom]}`} style={{ width: `${pct}%` }} />
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#2563eb] hover:underline"
      >
        {open ? "Hide roadmap" : "Show 10-level roadmap"}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <ol className="mt-3 space-y-1.5">
          {topics.map((topic, i) => {
            const level = i + 1;
            const isLocked = level > skill.required_level;
            return (
              <li
                key={level}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${
                  isLocked ? "border-dashed border-border bg-muted/40 text-muted-foreground" : "border-border bg-card text-foreground"
                }`}
              >
                <span className="w-6 shrink-0 font-mono font-semibold">L{level}</span>
                <span className="flex-1">{topic}</span>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide">
                    <Lock className="h-3 w-3" /> Beyond scope
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function SkillIntelligence() {
  const { selected, selectedId, isReady } = useCompany();
  const skillsQuery = useCompanySkills(selectedId);
  if (!isReady || skillsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="h-12 animate-pulse rounded-xl border border-border bg-muted" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (skillsQuery.isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Unable to load skill intelligence.</p>
          <button
            onClick={() => skillsQuery.refetch()}
            className="mt-3 rounded-md bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!selected) return null;
  const { skills, skillTopics } = skillsQuery.data ?? { skills: [], skillTopics: {} };
  const sorted = [...skills].sort((a, b) => b.required_level - a.required_level);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <CompanyLogo name={selected.name} websiteUrl={selected.website_url} fallbackUrl={selected.logo_url} size={40} />
        <h1 className="font-heading text-xl font-semibold text-foreground">{selected.name} Skill Intelligence</h1>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Bloom levels</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(Object.keys(BLOOM_LABEL) as DashboardSkill["bloom"][]).map((b) => (
            <div key={b} className={`rounded-md border px-2 py-1.5 text-center text-xs font-medium ${BLOOM_BG[b]}`}>
              {BLOOM_LABEL[b]}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(["Critical", "Important", "Baseline"] as DashboardSkill["criticality"][]).map((c) => (
          <div key={c} className={`rounded-md border px-3 py-2 text-xs font-medium ${CRIT_STYLE[c]}`}>
            <div className="font-semibold">{c}</div>
            <div className="text-[11px] opacity-80">
              {c === "Critical" && "Score ≥ 7 · must-have"}
              {c === "Important" && "Score 5–6 · differentiator"}
              {c === "Baseline" && "Score < 5 · foundational"}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sorted.map((s) => (
          <SkillCard key={s.skill_set_id} skill={s} topics={skillTopics[s.skill_set_id] ?? []} />
        ))}
      </div>
    </div>
  );
}
