import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { 
  ArrowLeftRight, Building2, ExternalLink, ShieldCheck, 
  Users, TrendingUp, BarChart3, Award, DollarSign, 
  Layers, Clock, Flame, Briefcase, HelpCircle, 
  FileText, Network, CheckCircle2, X
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { useCompanyProfile, useCompanySkills } from "@/lib/companyApi";
import { CompanyLogo } from "@/components/CompanyLogo";
import { isNullish, splitItems } from "@/lib/companyData";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from "recharts";

export const Route = createFileRoute("/company/compare")({
  component: CompareCompanies,
});

function CompareCompanies() {
  const { selected, companies, isReady } = useCompany();
  
  // State for up to 3 compared companies
  const [id1, setId1] = useState<number | null>(null);
  const [id2, setId2] = useState<number | null>(null);
  const [id3, setId3] = useState<number | null>(null);

  // Sync with selected company from sidebar/context if it changes
  useEffect(() => {
    if (selected?.company_id) {
      setId1(selected.company_id);
    }
  }, [selected?.company_id]);

  // If id1 is not set but context is ready, default to selected
  if (isReady && selected?.company_id && id1 === null) {
    setId1(selected.company_id);
  }

  // Fetch profiles
  const profile1 = useCompanyProfile(id1);
  const profile2 = useCompanyProfile(id2);
  const profile3 = useCompanyProfile(id3);

  // Fetch skills
  const skills1 = useCompanySkills(id1);
  const skills2 = useCompanySkills(id2);
  const skills3 = useCompanySkills(id3);

  const company1 = profile1.data;
  const company2 = profile2.data;
  const company3 = profile3.data;

  // Filter candidate dropdown selections to prevent picking the same company twice
  const getCandidates = (excludeA: number | null, excludeB: number | null) => {
    return companies.filter(c => c.company_id !== excludeA && c.company_id !== excludeB);
  };

  const candidates1 = getCandidates(id2, id3);
  const candidates2 = getCandidates(id1, id3);
  const candidates3 = getCandidates(id1, id2);

  // Parse tech stack strings into clean arrays
  const parseTechStack = (techStr: unknown): string[] => {
    if (isNullish(techStr)) return [];
    return splitItems(String(techStr)).map(s => s.trim()).filter(Boolean);
  };

  const tech1 = company1 ? parseTechStack(company1.profile.tech_stack) : [];
  const tech2 = company2 ? parseTechStack(company2.profile.tech_stack) : [];
  const tech3 = company3 ? parseTechStack(company3.profile.tech_stack) : [];

  // Venn tech stack intersection
  const techComparison = useMemo(() => {
    const activeStacks = [
      { name: company1?.summary?.name, stack: tech1 },
      { name: company2?.summary?.name, stack: tech2 },
      { name: company3?.summary?.name, stack: tech3 },
    ].filter(item => item.name && item.stack.length > 0);

    if (activeStacks.length === 0) {
      return { common: [], unique: [] };
    }

    // Find intersection across all active tech stacks
    const common = activeStacks[0].stack.filter(tech => 
      activeStacks.every(item => 
        item.stack.some(t => t.toLowerCase() === tech.toLowerCase())
      )
    );

    // Find unique tech for each active company
    const unique = activeStacks.map(item => {
      const others = activeStacks.filter(o => o.name !== item.name);
      const uniqueTech = item.stack.filter(tech => 
        !others.some(o => o.stack.some(t => t.toLowerCase() === tech.toLowerCase()))
      );
      return {
        companyName: item.name!,
        techs: uniqueTech
      };
    });

    return { common, unique };
  }, [company1, company2, company3, tech1, tech2, tech3]);

  // Synthesize skill requirement levels for a grouped Recharts bar chart
  const chartData = useMemo(() => {
    const skillSetNames = new Set<string>();
    
    const addSkills = (skills: any[] | undefined) => {
      if (!skills) return;
      skills.forEach(s => {
        if (s.skill_set_name) skillSetNames.add(s.skill_set_name);
      });
    };

    addSkills(skills1.data?.skills);
    addSkills(skills2.data?.skills);
    addSkills(skills3.data?.skills);

    return Array.from(skillSetNames).map(name => {
      const getLevel = (skills: any[] | undefined) => {
        const found = skills?.find(s => s.skill_set_name?.toLowerCase() === name.toLowerCase());
        return found ? found.required_level : 0;
      };

      const row: any = { name };
      if (company1) row[company1.summary.name] = getLevel(skills1.data?.skills);
      if (company2) row[company2.summary.name] = getLevel(skills2.data?.skills);
      if (company3) row[company3.summary.name] = getLevel(skills3.data?.skills);

      return row;
    });
  }, [company1, company2, company3, skills1.data, skills2.data, skills3.data]);

  const activeBars = useMemo(() => {
    return [
      { key: company1?.summary?.name, color: "#2d4a22" }, // Moss green
      { key: company2?.summary?.name, color: "#df9f28" }, // Cloud gold
      { key: company3?.summary?.name, color: "#b45309" }, // Sunset orange
    ].filter(bar => bar.key);
  }, [company1, company2, company3]);

  if (!isReady || profile1.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Loading comparison directory...</p>
      </div>
    );
  }

  const formatCellText = (val: unknown) => {
    if (isNullish(val)) return <span className="text-muted-foreground italic text-[11px]">N/A</span>;
    return <span className="text-xs font-semibold text-foreground leading-relaxed">{String(val)}</span>;
  };

  const renderCompanyCard = (
    num: number, 
    company: any, 
    candidates: any[], 
    setId: (id: number | null) => void,
    colorClass: string,
    themeColor: string
  ) => {
    return (
      <div className="rounded-2xl border border-border/85 bg-card/75 backdrop-blur-md p-5 shadow-xs hover:shadow-sm transition-all duration-300 relative flex flex-col justify-between min-h-[170px] hover:border-primary/20">
        {/* Header Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          {company && (
            <button
              onClick={() => setId(null)}
              className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colorClass}`}>
            Slot {num}
          </span>
        </div>

        {company ? (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-3">
              <CompanyLogo 
                name={company.summary.name} 
                websiteUrl={company.summary.website_url} 
                fallbackUrl={company.summary.logo_url} 
                size={44} 
              />
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                  {company.summary.company_type || "Regular"}
                </span>
                <h2 className="font-heading text-sm font-bold text-foreground truncate mt-0.5" title={company.summary.name}>
                  {company.summary.name}
                </h2>
                <span className="text-[10px] text-[#854d0e] font-bold block truncate mt-0.5">
                  {company.summary.category}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {company.summary.website_url && (
                <a
                  href={company.summary.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Website
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-4 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-[10px] font-semibold text-muted-foreground mb-3">Choose a company to compare</p>
          </div>
        )}

        {/* Dropdown Selector */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <select
            value={company?.summary?.company_id ?? ""}
            onChange={(e) => setId(Number(e.target.value) || null)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer shadow-2xs"
          >
            <option value="">-- Choose Company --</option>
            {candidates.map((c) => (
              <option key={c.company_id} value={c.company_id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const hasActiveComparison = company1 || company2 || company3;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Company Comparison Engine
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Compare up to three corporate profiles, required tech stacks, and skill benchmarks side-by-side.
          </p>
        </div>
      </div>

      {/* 3-Column Slot Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderCompanyCard(1, company1, candidates1, setId1, "bg-emerald-50 text-emerald-800 border border-emerald-200/60", "#2d4a22")}
        {renderCompanyCard(2, company2, candidates2, setId2, "bg-amber-50 text-amber-900 border border-amber-200/60", "#df9f28")}
        {renderCompanyCard(3, company3, candidates3, setId3, "bg-orange-50 text-orange-900 border border-orange-200/60", "#b45309")}
      </div>

      {hasActiveComparison ? (
        <div className="space-y-6">
          
          {/* 1. Comparison Matrix Table (Full-Width Row) */}
          <div className="rounded-2xl border border-primary/10 bg-card/75 backdrop-blur-md p-6 shadow-xs space-y-5 w-full">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3.5">
              <FileText className="h-4.5 w-4.5 text-primary" />
              <h3 className="font-heading text-sm font-bold text-foreground">Detailed Comparison Matrix</h3>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <div className="min-w-[750px] divide-y divide-border/40">
                {/* Header columns */}
                <div className="grid grid-cols-4 gap-6 pb-4 items-center font-heading">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Metric / Aspect
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    {company1 ? (
                      <>
                        <CompanyLogo name={company1.summary.name} websiteUrl={company1.summary.website_url} fallbackUrl={company1.summary.logo_url} size={28} />
                        <span className="text-xs font-bold text-foreground truncate">{company1.summary.name}</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Slot 1 Empty</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    {company2 ? (
                      <>
                        <CompanyLogo name={company2.summary.name} websiteUrl={company2.summary.website_url} fallbackUrl={company2.summary.logo_url} size={28} />
                        <span className="text-xs font-bold text-foreground truncate">{company2.summary.name}</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Slot 2 Empty</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    {company3 ? (
                      <>
                        <CompanyLogo name={company3.summary.name} websiteUrl={company3.summary.website_url} fallbackUrl={company3.summary.logo_url} size={28} />
                        <span className="text-xs font-bold text-foreground truncate">{company3.summary.name}</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Slot 3 Empty</span>
                    )}
                  </div>
                </div>

                {/* Grid features */}
                {[
                  { label: "Headquarters", val1: company1?.summary?.headquarters_address, val2: company2?.summary?.headquarters_address, val3: company3?.summary?.headquarters_address },
                  { label: "Employee Scale", val1: company1?.summary?.employee_size, val2: company2?.summary?.employee_size, val3: company3?.summary?.employee_size },
                  { label: "Annual Revenue", val1: company1?.profile?.annual_revenue, val2: company2?.profile?.annual_revenue, val3: company3?.profile?.annual_revenue },
                  { label: "YoY Growth", val1: company1?.summary?.yoy_growth_rate, val2: company2?.summary?.yoy_growth_rate, val3: company3?.summary?.yoy_growth_rate },
                  { label: "Remote Policy", val1: company1?.profile?.remote_policy_details, val2: company2?.profile?.remote_policy_details, val3: company3?.profile?.remote_policy_details },
                  { 
                    label: "Burnout & Hours", 
                    val1: company1 ? `${company1.profile.burnout_risk} (${company1.profile.typical_hours})` : null, 
                    val2: company2 ? `${company2.profile.burnout_risk} (${company2.profile.typical_hours})` : null, 
                    val3: company3 ? `${company3.profile.burnout_risk} (${company3.profile.typical_hours})` : null 
                  },
                  { label: "Work Culture", val1: company1?.profile?.work_culture_summary, val2: company2?.profile?.work_culture_summary, val3: company3?.profile?.work_culture_summary },
                ].map((row, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-6 py-3.5 items-start text-xs">
                    <div className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider pt-0.5">
                      {row.label}
                    </div>
                    <div className="pr-2">{formatCellText(row.val1)}</div>
                    <div className="pr-2">{formatCellText(row.val2)}</div>
                    <div className="pr-2">{formatCellText(row.val3)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Visual Charts & Venn (Stacked side-by-side) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Required Skills benchmark chart */}
            <div className="rounded-2xl border border-primary/10 bg-card/75 backdrop-blur-md p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                <BarChart3 className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-heading text-xs font-bold text-foreground">Required Skill Thresholds</h3>
              </div>
              
              {chartData.length > 0 ? (
                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.15)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 9, fill: "#64748b" }}
                        axisLine={{ stroke: "rgba(226, 232, 240, 0.2)" }} 
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        tickCount={6}
                        tick={{ fontSize: 9, fill: "#64748b" }}
                        axisLine={{ stroke: "rgba(226, 232, 240, 0.2)" }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: '10px', 
                          borderRadius: '8px', 
                          background: 'rgba(30, 41, 59, 0.95)', 
                          color: '#fff', 
                          border: 'none' 
                        }} 
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} 
                        iconType="circle"
                        iconSize={6}
                      />
                      {activeBars.map(bar => (
                        <Bar key={bar.key} dataKey={bar.key!} fill={bar.color} radius={[3, 3, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">
                  Select companies to populate required skill benchmarks.
                </div>
              )}
            </div>

            {/* Tech Stack venn breakdown */}
            <div className="rounded-2xl border border-primary/10 bg-card/75 backdrop-blur-md p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                <Network className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-heading text-xs font-bold text-foreground">Technology Intersection Analysis</h3>
              </div>

              <div className="space-y-4">
                {/* Shared Tech Stack */}
                {techComparison.common.length > 0 && (
                  <div className="space-y-2 p-3.5 bg-primary/5 border border-primary/10 rounded-xl">
                    <span className="text-[10px] font-bold text-primary block tracking-wide uppercase">
                      Shared Stack ({techComparison.common.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {techComparison.common.map((tech, idx) => (
                        <span key={idx} className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[9px] font-bold">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unique Tech Lists */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {techComparison.unique.map((item, idx) => {
                    const colors = [
                      "border-emerald-100 text-emerald-800 bg-emerald-50/40",
                      "border-amber-100 text-amber-800 bg-amber-50/40",
                      "border-orange-100 text-orange-850 bg-orange-50/40"
                    ];
                    return (
                      <div key={idx} className="space-y-2 p-3 bg-secondary/20 border border-border/40 rounded-xl min-h-[110px]">
                        <span className="text-[9px] font-extrabold text-muted-foreground block uppercase tracking-wide truncate border-b border-border/30 pb-1">
                          Unique to {item.companyName.split(" ")[0]}
                        </span>
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {item.techs.length > 0 ? item.techs.map((tech, sIdx) => (
                            <span key={sIdx} className={`rounded-full border px-1.5 py-0.5 text-[8.5px] font-bold ${colors[idx % 3]}`}>
                              {tech}
                            </span>
                          )) : (
                            <span className="text-[9px] text-muted-foreground italic">None identified</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 p-16 text-center text-muted-foreground space-y-3 bg-muted/10">
          <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <h3 className="font-heading font-bold text-sm text-foreground">No Comparison Selected</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Select one or more target employers from the dropdown lists above to start a detailed aspect-by-aspect analysis.
          </p>
        </div>
      )}
    </div>
  );
}
