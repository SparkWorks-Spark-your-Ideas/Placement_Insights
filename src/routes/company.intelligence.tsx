import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, memo } from "react";
import { ExternalLink, Linkedin } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { CompanyLogo } from "@/components/CompanyLogo";
import { FieldRow } from "@/components/FieldRow";
import { buildIntelligenceSections, type IntelligenceSection } from "@/data/intelligenceData";
import { useCompanyProfile } from "@/lib/companyApi";

export const Route = createFileRoute("/company/intelligence")({
  component: CompanyIntelligence,
});

const SectionCard = memo(function SectionCard({
  section, profile, idx, registerRef,
}: {
  section: IntelligenceSection;
  profile: Record<string, unknown>;
  idx: number;
  registerRef: (i: number, el: HTMLDivElement | null) => void;
}) {
  const Icon = section.icon;
  return (
    <div
      id={section.id}
      ref={(el) => registerRef(idx, el)}
      className="scroll-mt-32 rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-[#eff6ff] p-2 text-[#2563eb]">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="flex-1 font-heading text-lg font-semibold text-foreground">{section.title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {section.fields.length}
        </span>
      </div>
      <div className="divide-y divide-border/60">
        {section.fields.map((field) => (
          <FieldRow key={field.key} label={field.label} value={profile[field.key]} kind={field.kind} />
        ))}
      </div>
    </div>
  );
});

function CompanyIntelligence() {
  const { selectedId, isReady } = useCompany();
  const profileQuery = useCompanyProfile(selectedId);
  const sections = useMemo(() => buildIntelligenceSections(profileQuery.data?.profile), [profileQuery.data]);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const tabBarRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const isScrollingRef = useRef(false);

  const registerRef = (i: number, el: HTMLDivElement | null) => {
    refs.current[i] = el;
  };

  useEffect(() => {
    const onScroll = () => {
      if (isScrollingRef.current) return;
      const y = window.scrollY + 200;
      let current = 0;
      refs.current.forEach((el, i) => {
        if (el && el.offsetTop <= y) current = i;
      });
      setActiveIdx(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const tabBar = tabBarRef.current;
    if (!tabBar) return;
    const activeTab = tabBar.querySelector<HTMLElement>(`[data-tab-idx="${activeIdx}"]`);
    if (activeTab) {
      tabBar.scrollTo({
        left: activeTab.offsetLeft - tabBar.clientWidth / 2 + activeTab.clientWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeIdx]);

  const scrollToSection = (idx: number) => {
    const el = refs.current[idx];
    if (!el) return;
    isScrollingRef.current = true;
    setActiveIdx(idx);
    window.scrollTo({ top: el.offsetTop - 120, behavior: "smooth" });
    window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 600);
  };

  if (!isReady || profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="h-12 animate-pulse rounded-xl border border-border bg-muted" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Unable to load company intelligence.</p>
          <button
            onClick={() => profileQuery.refetch()}
            className="mt-3 rounded-md bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selected = profileQuery.data;
  if (!selected) return null;
  const { summary, profile } = selected;

  return (
    <div className="min-w-0 bg-background">
      <div className="sticky top-14 z-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <CompanyLogo name={summary.name} websiteUrl={summary.website_url} fallbackUrl={summary.logo_url} size={40} />
            <div className="min-w-0">
              <h1 className="truncate font-heading text-lg font-semibold text-foreground">{summary.name}</h1>
              <span className="inline-block max-w-full rounded-full bg-[#eff6ff] px-2 py-0.5 text-xs font-medium text-[#2563eb]">
                {summary.category}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {summary.website_url && (
              <a href={summary.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
                <ExternalLink className="h-3.5 w-3.5" /> Website
              </a>
            )}
            {String(profile.linkedin_url ?? "") && (
              <a href={String(profile.linkedin_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </a>
            )}
          </div>
        </div>
        <div
          ref={tabBarRef}
          className="no-scrollbar flex max-w-full gap-1 overflow-x-auto border-t border-border bg-card px-2 py-2"
        >
          {sections.map((s, i) => (
            <button
              key={s.id}
              data-tab-idx={i}
              onClick={() => scrollToSection(i)}
              className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeIdx === i
                  ? "bg-[#eff6ff] text-[#2563eb]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto min-w-0 max-w-5xl space-y-4 px-4 py-6 sm:px-6">
        {sections.map((section, idx) => (
          <SectionCard key={section.id} section={section} profile={profile} idx={idx} registerRef={registerRef} />
        ))}
      </div>
    </div>
  );
}
