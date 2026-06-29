# KITS Placement Intelligence Hub — Phase 1

**College:** Karunya Institute Of Technology and Sciences (KITS)

## Phase 1 scope

- UI-only build with a single hardcoded seed company (Accenture) in
  `src/data/seedCompanies.ts`.
- Fully **public** — no login, no auth, no protected routes, no Lovable
  Cloud / Supabase, no migrations.
- All pages render from the seed via normalizers in `src/lib/companyData.ts`
  whose inputs are the same JSON shapes (`short_json` / `full_json` /
  `skill_levels`) Phase 2 will pipe straight from database rows.

## Routes

| URL                       | File                                  |
|---------------------------|---------------------------------------|
| `/`                       | `src/routes/index.tsx`                |
| `/company`                | `src/routes/company.index.tsx` → redirect to `/company/intelligence` |
| `/company/intelligence`   | `src/routes/company.intelligence.tsx` |
| `/company/skills`         | `src/routes/company.skills.tsx`       |

Selected company is persisted to `localStorage["selected-company"]` so
intelligence and skill pages survive refresh.

## Stack note

This project is on **TanStack Start + TanStack Router (file-based) + Tailwind
v4**, the supported Lovable template. The original spec called for React
Router 6 + Tailwind v3; everything was adapted 1:1 with the same routes,
design tokens, and behavior.

## Phase 2

Swap the data layer to Supabase by feeding `short_json` / `full_json` /
`skill_levels` rows to `normalizeCompanySummary`, `normalizeCompanyProfile`,
and `normalizeDashboardSkills` — no UI changes required.

## Phase 2 — Supabase

Paste `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` into `.env`, then run
`npm install && npm run dev`.
