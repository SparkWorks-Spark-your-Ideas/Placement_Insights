import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, X, LogOut, User } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { CompanyCard } from "@/components/CompanyCard";
import { useAuth } from "@/context/AuthContext";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { PlacementChatbot } from "@/components/PlacementChatbot";
import { PrismaHero } from "@/components/ui/prisma-hero";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Karunya Institute Of Technology and Sciences Companies Research & Placement Analytics Portal" },
      { name: "description", content: "Your strategic edge for campus placements." },
    ],
  }),
  component: Index,
});

const FILTERS = [
  { id: "all", label: "All", color: "bg-primary text-primary-foreground border-primary" },
  { id: "super dream", label: "Super Dream", color: "bg-amber-700 text-white border-amber-700" },
  { id: "dream", label: "Dream", color: "bg-emerald-800 text-white border-emerald-800" },
  { id: "standard", label: "Standard", color: "bg-lime-800 text-white border-lime-800" },
  { id: "regular", label: "Regular", color: "bg-stone-700 text-white border-stone-700" },
];

function Index() {
  const { companies, isReady, companiesLoading, companiesError, refetchCompanies } = useCompany();
  const { profile, signOut } = useAuth();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState("all");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: companies.length };
    for (const c of companies) {
      const k = (c.company_type ?? "").trim().toLowerCase();
      if (k) map[k] = (map[k] ?? 0) + 1;
    }
    return map;
  }, [companies]);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const companyTypeLower = (c.company_type ?? "").trim().toLowerCase();
      const matchesFilter = filter === "all" || companyTypeLower === filter;
      if (!matchesFilter) return false;
      if (!debounced) return true;
      return [c.name, c.short_name, c.headquarters_address, c.category].some(
        (v) => (v ?? "").toLowerCase().includes(debounced),
      );
    });
  }, [companies, filter, debounced]);

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Analytics", to: "/analytics" },
    { label: "Compare", to: "/company/compare" },
    { label: "Hiring Drives", to: "/hiring-drives" },
    { label: "Intelligence", to: "/company/intelligence" },
  ];

  const handleExploreClick = () => {
    document.getElementById("explore-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const navbarContent = (
    <nav className="flex items-center justify-between gap-3 rounded-b-2xl bg-black/80 backdrop-blur px-4 py-3 sm:gap-6 md:gap-8 md:rounded-b-3xl md:px-8 max-w-5xl mx-auto border-x border-b border-[#E1E0CC]/10 shadow-lg mt-0">
      <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="text-[11px] font-medium transition-colors sm:text-xs md:text-sm hover:text-white"
            style={{ color: "rgba(225, 224, 204, 0.8)" }}
            activeProps={{ style: { color: "#E1E0CC", fontWeight: "bold" } }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      
      {profile ? (
        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium text-[#E1E0CC]/90 max-sm:hidden">
            {profile.full_name}
          </span>
          <span className="rounded-full bg-[#E1E0CC]/10 text-[#E1E0CC] text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wide border border-[#E1E0CC]/20 max-sm:hidden">
            {profile.role}
          </span>
          {profile.role === "student" && (
            <button
              onClick={() => setShowOnboarding(true)}
              className="flex items-center gap-1 font-semibold text-[#E1E0CC] hover:text-white transition-colors cursor-pointer"
            >
              <User className="h-3.5 w-3.5" /> <span className="max-sm:hidden">Profile Setup</span>
            </button>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-1 font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> <span className="max-sm:hidden">Sign Out</span>
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          className="text-xs sm:text-sm font-semibold text-black bg-[#E1E0CC] px-4 py-1.5 rounded-full hover:bg-white transition-colors"
        >
          Sign In
        </Link>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PrismaHero
        title="Placement Insights"
        subtitle="Your strategic edge for campus placements. Access real-time intelligence, interview preparation, and key statistics of top recruiters at Karunya Institute of Technology and Sciences."
        buttonText="Explore Companies"
        onButtonClick={handleExploreClick}
        navbarContent={navbarContent}
      />

      <main id="explore-section" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 scroll-mt-6">
        
        {/* Centered Badge */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center rounded-full bg-accent/40 border border-accent/70 px-4 py-1 text-[10px] font-semibold tracking-wider text-foreground uppercase shadow-sm">
            KITS · PLACEMENT SYSTEM
          </span>
        </div>

        {/* Centered Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-semibold text-center text-foreground tracking-tight mb-4">
          Placement Intelligence Directory
        </h2>

        {/* Centered Description */}
        <p className="text-sm md:text-base text-muted-foreground text-center max-w-3xl mx-auto mb-8 leading-relaxed">
          Explore {companies.length} leading companies hiring from KARUNYA UNIVERSITY. Access comprehensive skill maps, interview roadmaps, and historic placements data.
        </p>

        {/* Centered Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies by name or type..."
            className="w-full rounded-full border border-border bg-card py-3 pl-12 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground text-center placeholder:text-muted-foreground/60 shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Centered Filter Chips */}
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const count = counts[f.id] ?? 0;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase transition tracking-wider border cursor-pointer ${
                  active
                    ? `${f.color} shadow-sm`
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent/20"
                }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>


        {companiesError ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">Unable to load companies right now.</p>
            <button
              onClick={() => refetchCompanies()}
              className="mt-3 rounded-md bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : (companiesLoading || !isReady) ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">No companies match your filters.</p>
            <button
              onClick={() => { setQuery(""); setFilter("all"); }}
              className="mt-3 rounded-md bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Reset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((c) => (
              <CompanyCard key={c.company_id} summary={c} />
            ))}
          </div>
        )}
      </main>
      
      {showOnboarding && (
        <OnboardingWizard isDismissible={true} onClose={() => setShowOnboarding(false)} />
      )}

      <PlacementChatbot />
    </div>
  );
}
