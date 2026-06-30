import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Lock, Award, BookOpen, Layers, ShieldAlert, Sparkles, HelpCircle } from "lucide-react";
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
  CU: "bg-emerald-50/60 text-emerald-800 border-emerald-200/50",
  AP: "bg-lime-50/60 text-lime-800 border-lime-200/50",
  AS: "bg-yellow-50/60 text-yellow-800 border-yellow-200/50",
  EV: "bg-amber-50/60 text-amber-800 border-amber-200/50",
  CR: "bg-orange-50/60 text-orange-800 border-orange-200/50",
};

const BLOOM_BAR: Record<DashboardSkill["bloom"], string> = {
  CU: "bg-emerald-600",
  AP: "bg-lime-600",
  AS: "bg-yellow-500",
  EV: "bg-amber-600",
  CR: "bg-orange-600",
};

const CRIT_STYLE: Record<DashboardSkill["criticality"], string> = {
  Critical: "bg-amber-100/60 text-amber-900 border-amber-200/50",
  Important: "bg-emerald-100/60 text-emerald-800 border-emerald-200/50",
  Baseline: "bg-stone-200/60 text-stone-700 border-stone-300/50",
};

function SkillCard({ skill, topics }: { skill: DashboardSkill; topics: string[] }) {
  const [open, setOpen] = useState(false);
  const pct = (skill.required_level / 10) * 100;

  return (
    <div className="rounded-2xl border border-primary/10 bg-card/75 backdrop-blur-md p-5 shadow-xs transition-all hover:shadow-md hover:border-primary/20 flex flex-col gap-4 w-full">
      {/* Horizontal Alignment for Skill Card row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        
        {/* Left Column: Title & Category Tags */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <h3 className="font-heading text-lg font-bold text-foreground tracking-tight leading-tight">
            {skill.skill_set_name}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${BLOOM_BG[skill.bloom]}`}>
              {BLOOM_LABEL[skill.bloom]}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${CRIT_STYLE[skill.criticality]}`}>
              {skill.criticality}
            </span>
          </div>
        </div>

        {/* Right Column: Progress bar and expand button */}
        <div className="flex items-center gap-5 sm:gap-6 shrink-0">
          <div className="w-56 sm:w-64 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Required level</span>
              <span className="text-primary font-extrabold">{skill.required_level} / 10</span>
            </div>
            <div className="relative">
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full ${BLOOM_BAR[skill.bloom]} transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center h-9 px-3 rounded-xl border border-border bg-card/90 text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-secondary/40 transition-all shadow-2xs cursor-pointer text-xs font-semibold gap-1 shrink-0"
          >
            <span>{open ? "Hide Roadmap" : "View Roadmap"}</span>
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-2 border-t border-border/50 pt-5 space-y-4 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Curriculum Roadmap Stepper
          </h4>
          {/* Horizontal Stepper Grid (up to 5 columns per row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {topics.map((topic, i) => {
              const level = i + 1;
              const isLocked = level > skill.required_level;
              return (
                <div key={level} className="relative flex flex-col gap-2 rounded-xl p-3 border transition-all shadow-3xs bg-card/60 backdrop-blur-xs min-h-[96px] justify-between border-border hover:border-primary/20">
                  <div className="flex items-center justify-between gap-2 shrink-0">
                    {/* Badge number */}
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-extrabold ${
                      isLocked 
                        ? "bg-secondary text-muted-foreground border border-border" 
                        : "bg-primary text-primary-foreground border border-primary"
                    }`}>
                      {level}
                    </div>
                    {isLocked ? (
                      <span className="inline-flex items-center gap-0.5 rounded bg-stone-250/50 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-stone-500 border border-stone-200/50">
                        <Lock className="h-2 w-2" /> Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200/40">
                        Unlocked
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-xs mt-2 leading-relaxed ${isLocked ? "text-muted-foreground/80 font-medium" : "text-foreground font-semibold"}`}>
                    {topic}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SkillIntelligence() {
  const { selected, selectedId, isReady } = useCompany();
  const skillsQuery = useCompanySkills(selectedId);
  const [activeTab, setActiveTab] = useState<"skills" | "guide">("skills");

  const { skills, skillTopics } = useMemo(() => {
    return skillsQuery.data ?? { skills: [], skillTopics: {} };
  }, [skillsQuery.data]);

  const stats = useMemo(() => {
    const total = skills.length;
    const critical = skills.filter(s => s.criticality === "Critical").length;
    const important = skills.filter(s => s.criticality === "Important").length;
    const baseline = skills.filter(s => s.criticality === "Baseline").length;
    return { total, critical, important, baseline };
  }, [skills]);

  if (!isReady || skillsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="h-12 animate-pulse rounded-xl border border-border bg-muted" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (skillsQuery.isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Unable to load skill intelligence.</p>
          <button
            onClick={() => skillsQuery.refetch()}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!selected) return null;
  const sorted = [...skills].sort((a, b) => b.required_level - a.required_level);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <CompanyLogo name={selected.name} websiteUrl={selected.website_url} fallbackUrl={selected.logo_url} size={44} />
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">{selected.name} Skill Intelligence</h1>
            <p className="text-xs text-muted-foreground">Detailed core competencies mapping and 10-level learning curriculum.</p>
          </div>
        </div>
        
        {/* Toggle Guide Tab */}
        <div className="flex rounded-lg bg-secondary p-1 text-xs shadow-3xs">
          <button
            onClick={() => setActiveTab("skills")}
            className={`rounded-md px-3 py-1.5 font-semibold transition ${
              activeTab === "skills" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Skills Matrix
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`rounded-md px-3 py-1.5 font-semibold transition ${
              activeTab === "guide" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bloom Guide
          </button>
        </div>
      </div>

      {activeTab === "skills" ? (
        <>
          {/* Summary Dashboard widgets */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card/65 backdrop-blur-md p-4 shadow-3xs flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary border border-primary/20">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Skills</span>
                <p className="text-xl font-extrabold text-foreground">{stats.total}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/65 backdrop-blur-md p-4 shadow-3xs flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 text-amber-800 p-2 border border-amber-200/50">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Critical Skills</span>
                <p className="text-xl font-extrabold text-foreground">{stats.critical}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/65 backdrop-blur-md p-4 shadow-3xs flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 text-emerald-800 p-2 border border-emerald-200/50">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Important</span>
                <p className="text-xl font-extrabold text-foreground">{stats.important}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/65 backdrop-blur-md p-4 shadow-3xs flex items-center gap-3">
              <div className="rounded-lg bg-stone-100 text-stone-700 p-2 border border-stone-200/50">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Baseline</span>
                <p className="text-xl font-extrabold text-foreground">{stats.baseline}</p>
              </div>
            </div>
          </div>

          {/* Cards Stacked One-by-One */}
          <div className="flex flex-col gap-4 w-full">
            {sorted.map((s) => (
              <SkillCard key={s.skill_set_id} skill={s} topics={skillTopics[s.skill_set_id] ?? []} />
            ))}
          </div>
        </>
      ) : (
        /* Explanatory Bloom/Criticality Guide Tab */
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card/75 backdrop-blur-md p-5 shadow-xs space-y-4">
            <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Cognitive Level Taxonomy (Bloom)
            </h2>
            <p className="text-xs text-muted-foreground">
              Skills are categorized using the Bloom Cognitive Taxonomy, mapping levels of expected expertise from foundational to engineering design.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
              {(Object.keys(BLOOM_LABEL) as DashboardSkill["bloom"][]).map((b) => (
                <div key={b} className={`rounded-lg border p-4 text-center space-y-1.5 transition ${BLOOM_BG[b]}`}>
                  <span className="text-xs font-bold uppercase tracking-wider">{b}</span>
                  <div className="font-heading text-xs font-semibold">{BLOOM_LABEL[b].split(" · ")[1]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/75 backdrop-blur-md p-5 shadow-xs space-y-4">
            <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Criticality Level Mapping
            </h2>
            <p className="text-xs text-muted-foreground">
              We separate skill sets based on their interview weights to prioritize prep time.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(["Critical", "Important", "Baseline"] as DashboardSkill["criticality"][]).map((c) => (
                <div key={c} className={`rounded-lg border p-4 space-y-2 transition ${CRIT_STYLE[c]}`}>
                  <div className="font-heading text-sm font-bold uppercase tracking-wider">{c}</div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {c === "Critical" && "Score ≥ 7 · Primary filter. Must be completely prepared. Failures in these lead to immediate rejection."}
                    {c === "Important" && "Score 5–6 · Differentiator. Demonstrating high level capabilities here sets you ahead in ranking."}
                    {c === "Baseline" && "Score < 5 · Foundational. Expected basic CS competencies that must satisfy minimum standards."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
