import { ExternalLink, Star } from "lucide-react";
import { isNullish, splitItems } from "@/lib/companyData";
import type { FieldKind } from "@/data/intelligenceData";

function NotAvailable() {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs italic text-muted-foreground">
      Not Available
    </span>
  );
}

function detectKind(value: string, declared: FieldKind = "auto"): FieldKind {
  if (declared !== "auto") return declared;
  if (/^https?:\/\//i.test(value)) return "url";
  if (/[;,]/.test(value) && value.length > 30) return "list";
  if (value.length > 120) return "paragraph";
  return "auto";
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-foreground">
      {children}
    </span>
  );
}

export function renderValue(raw: unknown, kind: FieldKind = "auto") {
  if (isNullish(raw)) return <NotAvailable />;
  const value = String(raw);
  const k = detectKind(value, kind);

  if (k === "url") {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2563eb] hover:underline break-all">
        {value}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  if (k === "video") {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2563eb] hover:underline">
        Watch video <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  if (k === "rating") {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
        <Star className="h-3.5 w-3.5 fill-[#eab308] text-[#eab308]" />
        {value}
      </span>
    );
  }
  if (k === "list") {
    const items = splitItems(value);
    if (items.length > 1) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <Pill key={i}>{it}</Pill>
          ))}
        </div>
      );
    }
  }
  if (k === "paragraph") {
    return <p className="text-sm leading-relaxed text-foreground">{value}</p>;
  }
  return <span className="text-sm text-foreground">{value}</span>;
}

export function FieldRow({ label, value, kind = "auto" }: { label: string; value: unknown; kind?: FieldKind }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-3 last:border-0 sm:flex-row sm:gap-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-1/3">{label}</div>
      <div className="sm:w-2/3">{renderValue(value, kind)}</div>
    </div>
  );
}
