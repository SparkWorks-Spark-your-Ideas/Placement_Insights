# KITS Placement Intelligence Hub

Welcome to the **KITS Placement Intelligence Hub**—a comprehensive Companies Research & Placement Analytics Portal custom-built for students at **Karunya Institute Of Technology and Sciences (KITS)**.

This portal provides students with a strategic edge in campus placement preparation by mapping required technical skill levels, dynamic 10-level learning roadmaps, company profiles, financials, and work culture indicators.

---

## 🚀 Key Features

*   **Company Intelligence Dashboard (`/`)**: Discover and search companies by name, location, or category. Filter by hiring tiers: *Super Dream*, *Dream*, *Standard*, and *Regular*.
*   **Deep Company Profile (`/company/intelligence`)**: Granular details across multiple categories including:
    *   *Identity & Overview* (legal name, timeline, nature, core values)
    *   *Leadership* (CEO, board members, warm intro pathways)
    *   *Funding & Financials* (revenue mix, valuation, growth metrics)
    *   *Tech Stack & Partnerships* (adoption level, R&D spend, ecosystem partners)
    *   *Competitive Landscape* (key competitors, market share, SWOT benchmarks)
    *   *Culture & Work Life* (burnout risk, remote policy, typical hours, safety, manager quality)
*   **Skill Intelligence (`/company/skills`)**: Maps required skills against standard proficiency frameworks:
    *   *Bloom's Taxonomy Levels* (Understand, Apply, Analyze, Evaluate, Create)
    *   *Criticality Mapping* (Critical, Important, Baseline)
    *   *Interactive 10-Level Roadmaps* showing exact learning milestones for each skill.
*   **Robust Logo Resolution**: Dynamic image resolution falling back from `logo.dev` to DuckDuckGo favicon proxies (to avoid CORS/404 breaks) and letter avatars.

---

## 🛠️ Technology Stack

*   **Frontend Library**: [React 19](https://react.dev/)
*   **Meta-Framework & Routing**: [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) + [TanStack Router](https://tanstack.com/router/v1/docs/guide/introduction) (File-Based routing)
*   **Data Fetching**: [TanStack Query (React Query) v5](https://tanstack.com/query/latest)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com) (Utility-first styling with modern CSS variables)
*   **Components**: [shadcn/ui](https://ui.shadcn.com/) primitives built on top of Radix UI

---

## 📂 Codebase Navigation

The project's key source directories inside `src/` are structured as follows:

*   [`/components`](file:///c:/Users/gokulp/Desktop/placement/Placement_Insights/src/components): UI elements like `AppSidebar.tsx`, `CompanyCard.tsx`, and `CompanyLogo.tsx`.
*   [`/context`](file:///c:/Users/gokulp/Desktop/placement/Placement_Insights/src/context): Context providers managing the selected company state (`CompanyContext.tsx`).
*   [`/data`](file:///c:/Users/gokulp/Desktop/placement/Placement_Insights/src/data): Metadata structures including seed company objects (`seedCompanies.ts`) and roadmap topics (`skillTopics.ts`).
*   [`/lib`](file:///c:/Users/gokulp/Desktop/placement/Placement_Insights/src/lib): Supabase client (`supabaseClient.ts`), query hooks (`companyApi.ts`), and normalizers (`companyData.ts`).
*   [`/routes`](file:///c:/Users/gokulp/Desktop/placement/Placement_Insights/src/routes): Declarative routing files mapping to site paths.

---

## ⚙️ Getting Started & Local Setup

### Prerequisites
*   [Node.js](https://nodejs.org) (v18 or higher recommended; v22 verified)
*   `npm` (v10+ verified)

### Installation
1.  Navigate to the project directory:
    ```bash
    cd Placement_Insights
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Configuration
Create a `.env` file in the project root (`c:\Users\gokulp\Desktop\placement\Placement_Insights\.env`) and configure the Supabase keys:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Locally
To launch the Vite development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port specified in your terminal) to explore the application.

---

## 🏗️ Production Build

To build the production bundle:
```bash
npm run build
```
To preview the production bundle locally:
```bash
npm run preview
```
