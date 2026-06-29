import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type CompanySummary } from "@/lib/companyData";
import { useCompanies } from "@/lib/companyApi";

const STORAGE_KEY = "selected-company";

interface SelectedRef {
  companyId: number;
  companyName: string;
  logoUrl: string;
}

interface CompanyCtx {
  companies: CompanySummary[];
  selected: CompanySummary | null;
  selectedId: number | null;
  selectCompany: (id: number) => void;
  clearSelection: () => void;
  isReady: boolean;
  companiesLoading: boolean;
  companiesError: Error | null;
  companiesLoaded: boolean;
  refetchCompanies: () => void;
}

const Ctx = createContext<CompanyCtx | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const companiesQuery = useCompanies();
  const companies = companiesQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ref = JSON.parse(raw) as SelectedRef;
        if (companies.some((c) => c.company_id === ref.companyId)) {
          setSelectedId(ref.companyId);
        }
      }
    } catch {
      /* ignore */
    }
    setIsReady(true);
  }, [companies]);

  const selectCompany = useCallback(
    (id: number) => {
      const c = companies.find((x) => x.company_id === id);
      if (!c) return;
      setSelectedId(id);
      if (typeof window !== "undefined") {
        const ref: SelectedRef = {
          companyId: c.company_id,
          companyName: c.name,
          logoUrl: c.logo_url,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ref));
      }
    },
    [companies],
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const selected = useMemo(() => companies.find((c) => c.company_id === selectedId) ?? null, [companies, selectedId]);

  return (
    <Ctx.Provider
      value={{
        companies,
        selected,
        selectedId,
        selectCompany,
        clearSelection,
        isReady,
        companiesLoading: companiesQuery.isLoading,
        companiesError: companiesQuery.error instanceof Error ? companiesQuery.error : null,
        companiesLoaded: companiesQuery.isSuccess,
        refetchCompanies: companiesQuery.refetch,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
