import { memo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, MapPin, TrendingDown, TrendingUp, Users } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { useCompany } from "@/context/CompanyContext";
import { isNullish, type CompanySummary } from "@/lib/companyData";

const TYPE_COLORS: Record<string, string> = {
  "super dream": "bg-[#7c3aed] text-white",
  dream: "bg-[#2563eb] text-white",
  standard: "bg-[#16a34a] text-white",
  regular: "bg-[#d97706] text-white",
};

function typeClass(t: string) {
  return TYPE_COLORS[t.trim().toLowerCase()] ?? "bg-muted text-foreground";
}

const NA = <span className="italic text-muted-foreground">not publicly available</span>;
const show = (v: string) => (isNullish(v) ? NA : v);

interface Props {
  summary: CompanySummary;
}

export const CompanyCard = memo(function CompanyCard({ summary }: Props) {
  const navigate = useNavigate();
  const { selectCompany } = useCompany();
  const growth = summary.yoy_growth_rate?.trim() ?? "";
  const isNegative = growth.startsWith("-");
  const TrendIcon = isNegative ? TrendingDown : TrendingUp;

  const onClick = () => {
    selectCompany(summary.company_id);
    navigate({ to: "/company/intelligence" });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left transition hover:border-[#2563eb]/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <CompanyLogo name={summary.name} websiteUrl={summary.website_url} fallbackUrl={summary.logo_url} size={48} />
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeClass(summary.company_type)}`}>
          {show(summary.company_type)}
        </span>
      </div>
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground line-clamp-1">{summary.name}</h3>
        <p className="text-xs text-muted-foreground">{summary.short_name}</p>
      </div>
      <ul className="mt-1 space-y-1.5 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{show(summary.headquarters_address)}</li>
        <li className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{show(summary.employee_size)}</li>
        <li className="flex items-center gap-1.5">
          <TrendIcon className={`h-3.5 w-3.5 ${isNegative ? "text-[#ef4444]" : "text-[#16a34a]"}`} />
          <span className={isNegative ? "text-[#ef4444]" : ""}>{show(growth)}</span>
        </li>
      </ul>
      <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-[#2563eb]" />
    </button>
  );
});
