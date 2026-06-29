import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { CompanyCard } from "@/components/CompanyCard";

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
  { id: "all", label: "All", color: "bg-foreground text-background" },
  { id: "super dream", label: "Super Dream", color: "bg-[#7c3aed] text-white" },
  { id: "dream", label: "Dream", color: "bg-[#2563eb] text-white" },
  { id: "standard", label: "Standard", color: "bg-[#16a34a] text-white" },
  { id: "regular", label: "Regular", color: "bg-[#d97706] text-white" },
];

function Index() {
  const { companies, isReady, companiesLoading, companiesError, refetchCompanies } = useCompany();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState("all");

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <span className="inline-flex items-center rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold tracking-wide text-[#2563eb]">
            KITS · INTELLIGENCE PLATFORM
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Karunya Institute Of Technology and Sciences Companies Research &amp; Placement Analytics Portal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Your strategic edge for campus placements.
          </p>
          <div className="relative mt-6 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies by name, location, or category…"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const count = counts[f.id] ?? 0;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active ? f.color : "border border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                {f.label}
                <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/20" : "bg-muted text-muted-foreground"}`}>
                  {count}
                </span>
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
    </div>
  );
}
