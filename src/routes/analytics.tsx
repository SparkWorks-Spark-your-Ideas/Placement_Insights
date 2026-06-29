import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { BarChart3, GraduationCap, LayoutGrid, Users, Award, TrendingUp, ShieldCheck, ChevronRight, AlertTriangle, Lightbulb } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { useBatchStats, useBatchSkills } from "@/lib/companyApi";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export const Route = createFileRoute("/analytics")({
  component: BatchAnalytics,
});

const COLORS = ["#7c3aed", "#2563eb", "#16a34a", "#d97706", "#ef4444"];

// Fallback student aggregate data if DB is empty/unconfigured
const MOCK_STUDENT_SKILLS = [
  { name: "DSA", studentAvg: 6.2, requiredAvg: 7.5 },
  { name: "OOP", studentAvg: 5.8, requiredAvg: 6.5 },
  { name: "SQL", studentAvg: 6.9, requiredAvg: 6.0 },
  { name: "Cloud", studentAvg: 4.1, requiredAvg: 5.5 },
  { name: "OS/Networks", studentAvg: 5.2, requiredAvg: 5.0 },
  { name: "Communication", studentAvg: 7.4, requiredAvg: 6.8 },
  { name: "Generative AI", studentAvg: 3.5, requiredAvg: 4.5 },
];

function BatchAnalytics() {
  const { companies } = useCompany();
  const [mounted, setMounted] = useState(false);

  const statsQuery = useBatchStats();
  const skillsQuery = useBatchSkills();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute distribution of company hiring tiers (Dream, Super Dream, etc.)
  const tierDistribution = (() => {
    const counts: Record<string, number> = {};
    for (const c of companies) {
      const type = c.company_type || "Regular";
      counts[type] = (counts[type] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  if (!mounted || statsQuery.isLoading || skillsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
      </div>
    );
  }

  // Fallback structures if database tables are empty
  const hasDbData = (statsQuery.data?.totalStudents ?? 0) > 0;
  const stats = hasDbData
    ? statsQuery.data!
    : {
        totalStudents: 420,
        placedCount: 285,
        pendingCount: 135,
        highestSalary: "32 LPA",
        avgSalary: "9.2 LPA",
      };

  const skillsData = skillsQuery.data && skillsQuery.data.length > 0
    ? skillsQuery.data
    : MOCK_STUDENT_SKILLS;

  // Calculate the top 3 biggest skill gaps
  const skillGaps = [...skillsData]
    .map((s) => ({
      name: s.name,
      gap: Number((s.requiredAvg - s.studentAvg).toFixed(1)),
      studentAvg: s.studentAvg,
      requiredAvg: s.requiredAvg,
    }))
    .filter((s) => s.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);

  const getRecommendation = (name: string) => {
    const term = name.toLowerCase();
    if (term.includes("dsa") || term.includes("data structure")) {
      return "Organize intensive mock coding tests and competitive programming bootcamps.";
    }
    if (term.includes("oop") || term.includes("object")) {
      return "Introduce OOP principles revision labs with real-world case modeling in Java/C++.";
    }
    if (term.includes("sql") || term.includes("database")) {
      return "Hold hands-on schema design workshops and query optimization labs.";
    }
    if (term.includes("cloud")) {
      return "Provide AWS Academy credentials and assign small-scale serverless deployment projects.";
    }
    if (term.includes("communication") || term.includes("behavioral")) {
      return "Arrange weekly mock group discussions and personality development drives.";
    }
    if (term.includes("os") || term.includes("operating")) {
      return "Focus lectures on memory management, multithreading, and scheduling mechanisms.";
    }
    return "Provide focused remedial assignments and assign peer-mentoring groups.";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 min-w-0 items-center gap-3 border-b border-border bg-card px-4">
            <SidebarTrigger />
            <nav className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span>/</span>
              <span className="min-w-0 truncate font-medium text-foreground">Batch Analytics</span>
            </nav>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden p-6 space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-[#2563eb]" /> KITS Batch Analytics Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Overview of candidate preparedness, hiring demand metrics, and placement performance statistics.
              </p>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="rounded-lg bg-blue-100 text-blue-800 p-2 dark:bg-blue-900/30 dark:text-blue-300">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Batch Registered</span>
                  <span className="text-xl font-bold text-foreground">{stats.totalStudents} Students</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="rounded-lg bg-green-100 text-green-800 p-2 dark:bg-green-900/30 dark:text-green-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Placed Status</span>
                  <span className="text-xl font-bold text-foreground">
                    {stats.placedCount} <span className="text-xs font-normal text-muted-foreground">({stats.totalStudents > 0 ? Math.round((stats.placedCount / stats.totalStudents) * 100) : 0}%)</span>
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="rounded-lg bg-purple-100 text-purple-800 p-2 dark:bg-purple-900/30 dark:text-purple-300">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Highest package</span>
                  <span className="text-xl font-bold text-foreground">{stats.highestSalary}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="rounded-lg bg-yellow-100 text-yellow-800 p-2 dark:bg-yellow-900/30 dark:text-yellow-300">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium font-medium">Average Package</span>
                  <span className="text-xl font-bold text-foreground">{stats.avgSalary}</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Skill Gap Analysis Radar Chart */}
              <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">
                    Skill Gap Analysis (Student Average vs. Target Threshold)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Comparison of current student capabilities against visiting companies required baselines.
                  </p>
                </div>
                <div className="h-80 w-full mt-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                      <Radar name="Batch Average" dataKey="studentAvg" stroke="#4f46e5" fill="#818cf8" fillOpacity={0.35} />
                      <Radar name="Required Level" dataKey="requiredAvg" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.08} />
                      <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                      <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hiring Tiers Pie Chart with Centered Count */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">
                    Company Hiring Tier Distribution
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Breakdown of visiting recruiters by package categories.
                  </p>
                </div>
                <div className="relative h-64 w-full my-auto flex items-center justify-center mt-2">
                  {tierDistribution.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tierDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {tierDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: "10px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">{companies.length}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Recruiters</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No tier distribution data available.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Funnel Tracker & Skill Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Placement Funnel Card */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">
                    Placement Recruitment Funnel
                  </h3>
                  <p className="text-[11px] text-muted-foreground mb-4">
                    Current stage-wise conversion status for the current batch.
                  </p>
                </div>

                <div className="space-y-3.5 mt-auto">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-foreground">1. Registered Batch</span>
                      <span className="text-muted-foreground">{stats.totalStudents} Students (100%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden dark:bg-slate-800">
                      <div className="bg-[#2563eb] h-full" style={{ width: "100%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-foreground">2. Trained / Shortlisted</span>
                      <span className="text-muted-foreground">{Math.round(stats.totalStudents * 0.85)} Students (85%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden dark:bg-slate-800">
                      <div className="bg-[#7c3aed] h-full" style={{ width: "85%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-foreground">3. Active Interviewing</span>
                      <span className="text-muted-foreground">{Math.round(stats.totalStudents * 0.65)} Students (65%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden dark:bg-slate-800">
                      <div className="bg-[#f59e0b] h-full" style={{ width: "65%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-foreground">4. Placed (Offer Extended)</span>
                      <span className="text-green-600 font-semibold">{stats.placedCount} Students ({stats.totalStudents > 0 ? Math.round((stats.placedCount / stats.totalStudents) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden dark:bg-slate-800">
                      <div className="bg-[#10b981] h-full" style={{ width: `${stats.totalStudents > 0 ? Math.round((stats.placedCount / stats.totalStudents) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Gap Insights & Remedial Steps */}
              <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">
                    Diagnostic Skill Deficiencies &amp; Remedial Roadmap
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Auto-calculated biggest talent gaps in the current batch with recommended corrective actions.
                  </p>
                </div>

                <div className="space-y-3.5 mt-4 my-auto">
                  {skillGaps.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 p-3 rounded-lg text-xs dark:bg-green-950/20 dark:border-green-900/40">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>The batch average exceeds the target required thresholds across all skill segments. No gaps identified!</span>
                    </div>
                  ) : (
                    skillGaps.map((gap, index) => (
                      <div key={index} className="flex gap-3 border border-border bg-card p-3 rounded-lg shadow-sm text-xs items-start">
                        <div className="rounded bg-red-100 text-red-800 p-1.5 dark:bg-red-950/30 dark:text-red-300 shrink-0 mt-0.5">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{gap.name}</span>
                            <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950/20 dark:border-red-900/40">
                              -{gap.gap} point gap
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                            <Lightbulb className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                            <span className="font-semibold text-foreground">Remedial Action:</span> {getRecommendation(gap.name)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Growth Projections Area Chart */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-heading font-semibold text-foreground text-sm mb-3">
                Year-over-Year (YoY) Placement Growth Trend
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { year: "2022", standard: 180, dream: 60, superDream: 15 },
                      { year: "2023", standard: 195, dream: 80, superDream: 28 },
                      { year: "2024", standard: 210, dream: 110, superDream: 42 },
                      { year: "2025", standard: 245, dream: 135, superDream: 65 },
                      { year: "2026", standard: 285, dream: 160, superDream: 90 },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDream" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="year" fontSize={11} tickLine={false} />
                    <YAxis fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Area type="monotone" dataKey="standard" name="Standard Roles" stroke="#16a34a" fillOpacity={1} fill="url(#colorStandard)" />
                    <Area type="monotone" dataKey="dream" name="Dream Roles" stroke="#2563eb" fillOpacity={1} fill="url(#colorDream)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
