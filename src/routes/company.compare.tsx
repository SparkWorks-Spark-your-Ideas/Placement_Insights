import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeftRight, Building2, ExternalLink, ShieldCheck, Star, Users } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { useCompanyProfile, useCompanySkills } from "@/lib/companyApi";
import { CompanyLogo } from "@/components/CompanyLogo";
import { isNullish, splitItems } from "@/lib/companyData";

export const Route = createFileRoute("/company/compare")({
  component: CompareCompanies,
});

function CompareCompanies() {
  const { selected, companies, isReady } = useCompany();
  const [compareId, setCompareId] = useState<number | null>(null);

  // Fetch profiles
  const profileA = useCompanyProfile(selected?.company_id);
  const profileB = useCompanyProfile(compareId);

  // Fetch skills
  const skillsA = useCompanySkills(selected?.company_id);
  const skillsB = useCompanySkills(compareId);

  if (!isReady || profileA.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent mx-auto" />
        <p className="mt-2 text-sm text-muted-foreground">Loading primary company profile...</p>
      </div>
    );
  }

  const selectedCompany = profileA.data;
  const compCompany = profileB.data;

  // Filter comparison candidates (exclude primary selected company)
  const candidates = companies.filter((c) => c.company_id !== selected?.company_id);

  const formatList = (val: unknown) => {
    if (isNullish(val)) return <span className="text-muted-foreground italic">NA</span>;
    const items = splitItems(String(val));
    return (
      <div className="flex flex-wrap gap-1">
        {items.map((it, idx) => (
          <span key={idx} className="rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-medium text-foreground">
            {it}
          </span>
        ))}
      </div>
    );
  };

  const formatText = (val: unknown) => {
    if (isNullish(val)) return <span className="text-muted-foreground italic">NA</span>;
    return <span className="text-sm font-medium text-foreground">{String(val)}</span>;
  };

  // Build a map of skills from Company B for side-by-side comparison
  const skillsBMap = new Map<string, number>();
  if (skillsB.data?.skills) {
    for (const s of skillsB.data.skills) {
      skillsBMap.set(s.skill_set_name.toLowerCase(), s.required_level);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-[#2563eb]" /> Company Comparison Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compare <span className="font-semibold text-foreground">{selected?.name}</span> side-by-side with another target employer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="compare-select" className="text-xs font-semibold text-muted-foreground uppercase">Compare with:</label>
          <select
            id="compare-select"
            value={compareId ?? ""}
            onChange={(e) => setCompareId(Number(e.target.value) || null)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#2563eb] transition"
          >
            <option value="">Select a company...</option>
            {candidates.map((c) => (
              <option key={c.company_id} value={c.company_id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Selected Company */}
        {selectedCompany && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
              <CompanyLogo name={selectedCompany.summary.name} websiteUrl={selectedCompany.summary.website_url} fallbackUrl={selectedCompany.summary.logo_url} size={48} />
              <div>
                <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 uppercase">
                  {selectedCompany.summary.company_type || "Regular"}
                </span>
                <h2 className="font-heading text-lg font-bold text-foreground mt-0.5">{selectedCompany.summary.name}</h2>
                <span className="text-xs text-muted-foreground">{selectedCompany.summary.category}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">Overview & Financials</h3>
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Headquarters</span>
                  {formatText(selectedCompany.summary.headquarters_address)}
                </div>
                <div>
                  <span className="text-muted-foreground block">Employee Size</span>
                  {formatText(selectedCompany.summary.employee_size)}
                </div>
                <div>
                  <span className="text-muted-foreground block">YoY Growth Rate</span>
                  {formatText(selectedCompany.summary.yoy_growth_rate)}
                </div>
                <div>
                  <span className="text-muted-foreground block">Annual Revenue</span>
                  {formatText(selectedCompany.profile.annual_revenue)}
                </div>
              </div>

              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">Core Tech Stack</h3>
              <div className="p-1">
                {formatList(selectedCompany.profile.tech_stack)}
              </div>

              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">Culture & Workspace</h3>
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Remote Policy</span>
                  {formatText(selectedCompany.profile.remote_policy_details)}
                </div>
                <div>
                  <span className="text-muted-foreground block">Typical Hours</span>
                  {formatText(selectedCompany.profile.typical_hours)}
                </div>
                <div>
                  <span className="text-muted-foreground block">Burnout Risk</span>
                  {formatText(selectedCompany.profile.burnout_risk)}
                </div>
                <div>
                  <span className="text-muted-foreground block">Work Culture Summary</span>
                  {formatText(selectedCompany.profile.work_culture_summary)}
                </div>
              </div>

              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">Required Skills Level</h3>
              <div className="space-y-2.5">
                {skillsA.isLoading ? (
                  <div className="h-10 animate-pulse rounded bg-muted" />
                ) : (skillsA.data?.skills ?? []).map((s) => {
                  const bLevel = skillsBMap.get(s.skill_set_name.toLowerCase()) ?? 0;
                  return (
                    <div key={s.skill_set_id} className="text-xs space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">{s.skill_set_name}</span>
                        <span className="text-foreground">{s.required_level}/10</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                        <div className="h-full bg-blue-600" style={{ width: `${s.required_level * 10}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Comparison Company */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {profileB.isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading comparison candidate...</p>
            </div>
          ) : compCompany ? (
            <div>
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <CompanyLogo name={compCompany.summary.name} websiteUrl={compCompany.summary.website_url} fallbackUrl={compCompany.summary.logo_url} size={48} />
                <div>
                  <span className="rounded-full bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 uppercase">
                    {compCompany.summary.company_type || "Regular"}
                  </span>
                  <h2 className="font-heading text-lg font-bold text-foreground mt-0.5">{compCompany.summary.name}</h2>
                  <span className="text-xs text-muted-foreground">{compCompany.summary.category}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-600">Overview & Financials</h3>
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Headquarters</span>
                    {formatText(compCompany.summary.headquarters_address)}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Employee Size</span>
                    {formatText(compCompany.summary.employee_size)}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">YoY Growth Rate</span>
                    {formatText(compCompany.summary.yoy_growth_rate)}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Annual Revenue</span>
                    {formatText(compCompany.profile.annual_revenue)}
                  </div>
                </div>

                <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-600">Core Tech Stack</h3>
                <div className="p-1">
                  {formatList(compCompany.profile.tech_stack)}
                </div>

                <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-600">Culture & Workspace</h3>
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Remote Policy</span>
                    {formatText(compCompany.profile.remote_policy_details)}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Typical Hours</span>
                    {formatText(compCompany.profile.typical_hours)}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Burnout Risk</span>
                    {formatText(compCompany.profile.burnout_risk)}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Work Culture Summary</span>
                    {formatText(compCompany.profile.work_culture_summary)}
                  </div>
                </div>

                <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-600">Required Skills Level</h3>
                <div className="space-y-2.5">
                  {skillsB.isLoading ? (
                    <div className="h-10 animate-pulse rounded bg-muted" />
                  ) : (skillsB.data?.skills ?? []).map((s) => {
                    return (
                      <div key={s.skill_set_id} className="text-xs space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-muted-foreground">{s.skill_set_name}</span>
                          <span className="text-foreground">{s.required_level}/10</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                          <div className="h-full bg-purple-600" style={{ width: `${s.required_level * 10}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-32 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 text-muted-foreground mb-3 opacity-40" />
              <h3 className="font-heading font-semibold text-sm">No Comparison Selected</h3>
              <p className="text-xs mt-1 max-w-[240px] mx-auto">
                Use the dropdown at the top right to select a company and see a detailed comparison side-by-side.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
