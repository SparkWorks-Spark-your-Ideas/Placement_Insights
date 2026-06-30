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
      { key: company1?.summary?.name, color: "#2563eb" },
      { key: company2?.summary?.name, color: "#7c3aed" },
      { key: company3?.summary?.name, color: "#16a34a" },
    ].filter(bar => bar.key);
  }, [company1, company2, company3]);

  if (!isReady) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Loading comparison directory...</p>
      </div>
    );
  }

  const formatCellText = (val: unknown) => {
    if (isNullish(val)) return <span className="text-muted-foreground italic text-xs">N/A</span>;
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
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col justify-between min-h-[170px]">
        {/* Header Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          {company && (
            <button
              onClick={() => setId(null)}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colorClass}`}>
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
                <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
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
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
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
            className="w-full rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-[11px] font-semibold text-foreground outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
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
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            Company Comparison Engine
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Compare up to three corporate profiles, required tech stacks, and skill benchmarks side-by-side.
          </p>
        </div>
      </div>

      {/* 3-Column Slot Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderCompanyCard(1, company1, candidates1, setId1, "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400", "#2563eb")}
        {renderCompanyCard(2, company2, candidates2, setId2, "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400", "#7c3aed")}
        {renderCompanyCard(3, company3, candidates3, setId3, "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400", "#16a34a")}
      </div>

      {hasActiveComparison ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column Left: Visual Charts */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Required Skills benchmark chart */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                <BarChart3 className="h-4.5 w-4.5 text-blue-500" />
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
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                <Network className="h-4.5 w-4.5 text-blue-500" />
                <h3 className="font-heading text-xs font-bold text-foreground">Technology Intersection Analysis</h3>
              </div>

              <div className="space-y-4">
                {/* Shared Tech Stack */}
                {techComparison.common.length > 0 && (
                  <div className="space-y-2 p-3.5 bg-blue-50/10 border border-blue-100/10 rounded-xl">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block tracking-wide uppercase">
                      Shared Stack ({techComparison.common.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {techComparison.common.map((tech, idx) => (
                        <span key={idx} className="rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/20 px-2 py-0.5 text-[9px] font-bold">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unique Tech Lists */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {techComparison.unique.map((item, idx) => {
                    const colors = [
                      "border-blue-100 text-blue-800 dark:text-blue-400",
                      "border-purple-100 text-purple-800 dark:text-purple-400",
                      "border-green-100 text-green-800 dark:text-green-400"
                    ];
                    return (
                      <div key={idx} className="space-y-2 p-3 bg-muted/40 border border-border/50 rounded-xl">
                        <span className="text-[9px] font-bold text-muted-foreground block uppercase tracking-wide truncate">
                          Unique to {item.companyName}
                        </span>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.techs.length > 0 ? item.techs.map((tech, sIdx) => (
                            <span key={sIdx} className={`rounded-full bg-card border px-1.5 py-0.5 text-[9px] font-semibold ${colors[idx % 3]}`}>
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

          {/* Right Column: Key parameter list */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                <FileText className="h-4.5 w-4.5 text-blue-500" />
                <h3 className="font-heading text-xs font-bold text-foreground">Detailed Parameter Grid</h3>
              </div>

              <div className="space-y-4 divide-y divide-border/40">
                {/* Headquarters */}
                <div className="pt-2 first:pt-0 space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Headquarters</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 1</span>
                      {formatCellText(company1?.summary?.headquarters_address)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 2</span>
                      {formatCellText(company2?.summary?.headquarters_address)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 3</span>
                      {formatCellText(company3?.summary?.headquarters_address)}
                    </div>
                  </div>
                </div>

                {/* Scale Size */}
                <div className="pt-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Employee Scale</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 1</span>
                      {formatCellText(company1?.summary?.employee_size)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 2</span>
                      {formatCellText(company2?.summary?.employee_size)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 3</span>
                      {formatCellText(company3?.summary?.employee_size)}
                    </div>
                  </div>
                </div>

                {/* Annual Revenue */}
                <div className="pt-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Annual Revenue</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 1</span>
                      {formatCellText(company1?.profile?.annual_revenue)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 2</span>
                      {formatCellText(company2?.profile?.annual_revenue)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 3</span>
                      {formatCellText(company3?.profile?.annual_revenue)}
                    </div>
                  </div>
                </div>

                {/* YoY Growth */}
                <div className="pt-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">YoY Growth Rate</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 1</span>
                      {formatCellText(company1?.summary?.yoy_growth_rate)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 2</span>
                      {formatCellText(company2?.summary?.yoy_growth_rate)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 3</span>
                      {formatCellText(company3?.summary?.yoy_growth_rate)}
                    </div>
                  </div>
                </div>

                {/* Remote Policy */}
                <div className="pt-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Remote Policy</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 1</span>
                      {formatCellText(company1?.profile?.remote_policy_details)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 2</span>
                      {formatCellText(company2?.profile?.remote_policy_details)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 3</span>
                      {formatCellText(company3?.profile?.remote_policy_details)}
                    </div>
                  </div>
                </div>

                {/* Hours & Burnout */}
                <div className="pt-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Burnout Risk &amp; Hours</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 1</span>
                      {formatCellText(company1 ? `${company1.profile.burnout_risk} (${company1.profile.typical_hours})` : null)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 2</span>
                      {formatCellText(company2 ? `${company2.profile.burnout_risk} (${company2.profile.typical_hours})` : null)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 3</span>
                      {formatCellText(company3 ? `${company3.profile.burnout_risk} (${company3.profile.typical_hours})` : null)}
                    </div>
                  </div>
                </div>

                {/* Culture Summary */}
                <div className="pt-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Culture Summary</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 1</span>
                      {formatCellText(company1?.profile?.work_culture_summary)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 2</span>
                      {formatCellText(company2?.profile?.work_culture_summary)}
                    </div>
                    <div className="p-2 rounded bg-muted/40 text-center min-w-0">
                      <span className="text-[9px] text-muted-foreground block truncate">Slot 3</span>
                      {formatCellText(company3?.profile?.work_culture_summary)}
                    </div>
                  </div>
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
