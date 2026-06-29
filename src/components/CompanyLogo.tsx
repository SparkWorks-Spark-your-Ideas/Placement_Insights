import { useState } from "react";
import { isNullish } from "@/lib/companyData";

interface Props {
  name: string;
  websiteUrl?: string;
  /** @deprecated logo_url from DB is often stale – websiteUrl is used for reliable service lookups */
  fallbackUrl?: string;
  size?: number;
  className?: string;
}

function domainFromUrl(url?: string): string | null {
  if (!url || isNullish(url)) return null;
  try {
    const parsed = new URL(url.trim());
    // Reject non-http(s) or localhost/IP addresses
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname)) return null;
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Build a prioritised list of logo candidates for a company.
 * Sources tried in order:
 *   1. logo.dev  (high quality, needs API key env var)
 *   2. DuckDuckGo favicon  (reliable, CORS-safe, never 404s, no key needed)
 * Falls back to letter-avatar if all fail.
 */
function buildCandidates(websiteUrl: string | undefined, logoDevKey: string | undefined, size: number): string[] {
  const domain = domainFromUrl(websiteUrl);
  if (!domain) return [];

  const candidates: string[] = [];

  if (logoDevKey) {
    candidates.push(`https://img.logo.dev/${domain}?token=${logoDevKey}&size=${size * 2}&format=png`);
  }

  // DuckDuckGo favicon proxy – always returns an image, never a 404, CORS-safe
  candidates.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);

  return candidates;
}

export function CompanyLogo({ name, websiteUrl, size = 48, className = "" }: Props) {
  const key = import.meta.env.VITE_LOGO_DEV_PUBLISHABLE_KEY as string | undefined;
  const candidates = buildCandidates(websiteUrl, key, size);
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];

  if (!src) {
    return <LogoAvatar name={name} size={size} className={className} />;
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={`rounded-md object-contain bg-white ${className}`}
      style={{ width: size, height: size }}
      onError={() => setIdx((prev) => prev + 1)}
    />
  );
}

function LogoAvatar({ name, size, className }: { name: string; size: number; className: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md bg-muted font-heading font-semibold text-muted-foreground ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
