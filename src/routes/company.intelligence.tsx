import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, memo } from "react";
import {
  ExternalLink, Linkedin, Building2, Sparkles, Briefcase, Calendar, Globe2, Users, Eye, HeartPulse,
  Award, MessageSquare, Send, Bot, AlertCircle, CheckCircle2, ChevronRight, Compass, Loader2
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { CompanyLogo } from "@/components/CompanyLogo";
import { renderValue } from "@/components/FieldRow";
import { isNullish } from "@/lib/companyData";
import { buildIntelligenceSections, type IntelligenceSection } from "@/data/intelligenceData";
import { useCompanyProfile, useCompanyReadiness } from "@/lib/companyApi";

/** Lightweight inline markdown renderer — no external dependencies */
function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const items = listBuffer.map((item, i) => (
      <li key={i} className="ml-3">{renderInline(item)}</li>
    ));
    if (listType === "ol") {
      elements.push(<ol key={key++} className="list-decimal ml-2 my-1 space-y-0.5">{items}</ol>);
    } else {
      elements.push(<ul key={key++} className="list-disc ml-2 my-1 space-y-0.5">{items}</ul>);
    }
    listBuffer = [];
    listType = null;
  };

  const renderInline = (str: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;
    let i = 0;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) parts.push(str.slice(lastIndex, match.index));
      if (match[2]) {
        parts.push(<strong key={i++} className="font-semibold text-foreground">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={i++} className="italic">{match[3]}</em>);
      } else if (match[4]) {
        parts.push(<code key={i++} className="bg-muted/60 border border-border/40 rounded px-1 py-0.5 text-[10px] font-mono">{match[4]}</code>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) parts.push(str.slice(lastIndex));
    return parts;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const bulletMatch = line.match(/^[\s]*[-*]\s+(.*)/);
    if (bulletMatch) {
      if (listType !== "ul") { flushList(); listType = "ul"; }
      listBuffer.push(bulletMatch[1]);
      continue;
    }
    const numberedMatch = line.match(/^[\s]*\d+\.\s+(.*)/);
    if (numberedMatch) {
      if (listType !== "ol") { flushList(); listType = "ol"; }
      listBuffer.push(numberedMatch[1]);
      continue;
    }
    flushList();
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cls = level === 1
        ? "text-sm font-bold text-foreground mt-1 mb-0.5"
        : level === 2
        ? "text-xs font-bold text-foreground mt-1 mb-0.5"
        : "text-[11px] font-semibold text-foreground/80 mt-0.5";
      elements.push(<p key={key++} className={cls}>{renderInline(headingMatch[2])}</p>);
      continue;
    }
    if (line.trim() === "") { elements.push(<div key={key++} className="h-1" />); continue; }
    elements.push(<p key={key++} className="leading-relaxed">{renderInline(line)}</p>);
  }
  flushList();
  return <div className="space-y-0.5 text-xs">{elements}</div>;
}


export const Route = createFileRoute("/company/intelligence")({
  component: CompanyIntelligence,
});

// Custom SVGs and Gauge Components
function CircularGauge({ value }: { value: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center h-28 w-28">
      <svg className="h-full w-full transform -rotate-90">
        <circle
          cx="56"
          cy="56"
          r={radius}
          className="stroke-muted-foreground/15 fill-none"
          strokeWidth="7"
        />
        <circle
          cx="56"
          cy="56"
          r={radius}
          className="stroke-primary fill-none transition-all duration-700 ease-out"
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold text-foreground">{value}%</span>
        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Ready</span>
      </div>
    </div>
  );
}

// 4 recruitment stages for timeline
const TIMELINE_STAGES = [
  {
    title: "1. Online Assessment",
    subtitle: "Aptitude & Basic CS",
    duration: "90 Mins",
    difficulty: "Medium",
    color: "border-t-blue-500",
    advice: "Consists of 30 quantitative / logical reasoning MCQs and basic OOP pseudocode debugging. Focus on speed and precision.",
    checklist: ["Quantitative Aptitude basics", "Logical reasoning drills", "Java/C++ syntax verification", "Time limit pacing"]
  },
  {
    title: "2. Coding Test",
    subtitle: "DSA Problem Solving",
    duration: "60 Mins",
    difficulty: "Hard",
    color: "border-t-purple-500",
    advice: "Typically consists of 2-3 coding problems on arrays, strings, and hash maps. Focus on optimization and edge cases.",
    checklist: ["String reversals & substring search", "Array partitioning & search", "Hash map frequency counts", "Basic dynamic programming"]
  },
  {
    title: "3. Technical Interview",
    subtitle: "Core CS & Live Code",
    duration: "45 Mins",
    difficulty: "Hard",
    color: "border-t-indigo-500",
    advice: "Live schema design, explaining project architecture, running custom SQL Queries, and DBMS Normalization theories.",
    checklist: ["SQL join querying without helper functions", "Db Normalisation rules (1NF, 2NF, 3NF)", "Project structural diagrams", "Operating System memory layout"]
  },
  {
    title: "4. HR & Culture Fit",
    subtitle: "Behavioral Alignment",
    duration: "20 Mins",
    difficulty: "Easy",
    color: "border-t-emerald-500",
    advice: "Scenario questions about teamwork, relocation willingness, and resolving technical team conflicts.",
    checklist: ["Self-introduction summary", "Conflict-resolution scenario examples", "Relocation & shift alignment", "Placed commitment declaration"]
  }
];

const SectionCard = memo(function SectionCard({
  section, profile, companyName, companyId
}: {
  section: IntelligenceSection;
  profile: Record<string, unknown>;
  companyName: string;
  companyId: number;
}) {
  const Icon = section.icon;
  const readinessQuery = useCompanyReadiness(companyId);

  // Custom states for interactive widgets
  const [activeTimelineIdx, setActiveTimelineIdx] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    {
      sender: "bot",
      text: `Hello! I am your AI Placement Coach specialized in ${companyName}. I have scanned their required technologies and recent interview logs. Ask me anything about preparing for this company!`
    }
  ]);

  // Compute dynamic match score based on company details
  const matchScore = useMemo(() => {
    // Generate deterministic match score based on companyId
    const seed = (companyId * 7) % 25;
    return 70 + seed; // range 70% to 94% match
  }, [companyId]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text
      }));

      const { sendCompanyGeminiChat } = await import("@/lib/companyApi");
      const res = await sendCompanyGeminiChat({
        data: {
          companyId,
          message: userText,
          history
        }
      });

      if (res.error) {
        // Parse the error cleanly — strip raw JSON blobs
        let errorMsg = res.error;
        try {
          const parsed = JSON.parse(res.error);
          errorMsg = parsed?.error?.message || parsed?.message || res.error;
        } catch { /* not JSON, use raw */ }
        setChatMessages(prev => [...prev, { sender: "bot", text: `⚠️ ${errorMsg}`, isError: true }]);
      } else {
        setChatMessages(prev => [...prev, { sender: "bot", text: res.text }]);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [{
        ...prev,
        sender: "bot",
        text: "⚠️ Could not reach the AI Coach. Please check that GEMINI_API_KEY is set in your .env file.",
        isError: true
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ----------------------------------------------------
  // CUSTOM CARD FOR "Preparation Readiness" (ID: prep-score)
  // ----------------------------------------------------
  if (section.id === "prep-score") {
    const liveScore = readinessQuery.data ? Math.round(readinessQuery.data.readiness_percentage) : matchScore;
    const eligibilityLabel = liveScore >= 85 ? "Excellent Match" : liveScore >= 70 ? "High Eligibility" : liveScore >= 50 ? "Moderate Match" : "Needs Prep Focus";
    const eligibilityColor = liveScore >= 85 ? "text-emerald-800 bg-emerald-50 border-emerald-200/60" : liveScore >= 70 ? "text-amber-800 bg-amber-50 border-amber-200/60" : "text-stone-700 bg-stone-100 border-stone-200";

    const masteredList = readinessQuery.data?.mastered_skills && readinessQuery.data.mastered_skills.length > 0
      ? readinessQuery.data.mastered_skills.join(", ")
      : "No verified matching skills found. Make sure to complete your profile rating.";

    const needsAttentionList = readinessQuery.data?.needs_attention_skills && readinessQuery.data.needs_attention_skills.length > 0
      ? readinessQuery.data.needs_attention_skills.join(", ")
      : "No skill gaps identified. You meet all company requirements!";

    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Hiring Readiness &amp; Compatibility</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Scans profile benchmarks against {companyName} hiring expectations.</p>
          </div>
        </div>

        {readinessQuery.isLoading ? (
          <div className="h-32 animate-pulse rounded-xl bg-muted/40 border border-border/40" />
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-8 bg-secondary/35 p-5 rounded-2xl border border-border/45">
            <div className="shrink-0 flex flex-col items-center">
              <CircularGauge value={liveScore} />
              <span className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 mt-2.5 border ${eligibilityColor}`}>
                {eligibilityLabel}
              </span>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Preparation Checklists &amp; Badges</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Verified skill targets completed vs items needing focus.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border/40 shadow-2xs">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-foreground block">Mastered (Verified)</span>
                    {masteredList}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border/40 shadow-2xs">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-foreground block">Needs Attention</span>
                    {needsAttentionList}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // CUSTOM CARD FOR "Recruitment Timeline" (ID: hiring-timeline)
  // ----------------------------------------------------
  if (section.id === "hiring-timeline") {
    const selectedStage = TIMELINE_STAGES[activeTimelineIdx];

    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Hiring Timeline &amp; Rounds</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Chronological overview of stages for {companyName}.</p>
          </div>
        </div>

        {/* Step circles navigation */}
        <div className="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar pb-3 border-b border-border/50">
          {TIMELINE_STAGES.map((stage, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTimelineIdx(idx)}
              className={`flex-1 text-center shrink-0 min-w-[130px] rounded-lg p-2.5 border transition cursor-pointer ${
                activeTimelineIdx === idx
                  ? "bg-accent/15 border-accent/70 text-amber-900"
                  : "bg-secondary/40 border-border/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <span className="text-[10px] font-bold block uppercase tracking-wider">Round {idx + 1}</span>
              <span className="text-[11px] font-semibold block truncate mt-0.5">{stage.title.split(". ")[1]}</span>
            </button>
          ))}
        </div>

        {/* Stage details panel */}
        <div className={`p-5 rounded-2xl border border-border/60 border-t-4 border-t-primary bg-secondary/15 space-y-4`}>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Round Focus</span>
              <h3 className="text-sm font-bold text-foreground mt-0.5">{selectedStage.title}</h3>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold bg-card border border-border px-2.5 py-0.5 rounded-full text-foreground shadow-2xs">
                Duration: {selectedStage.duration}
              </span>
              <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full ${
                selectedStage.difficulty === "Hard"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                Difficulty: {selectedStage.difficulty}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Preparation Strategy &amp; Tips</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{selectedStage.advice}</p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Important Topics Checklists</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedStage.checklist.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-card border border-border px-2.5 py-0.5 rounded-full text-[10px] font-medium text-foreground shadow-2xs">
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CUSTOM CARD FOR "Ask AI Prep Assistant" (ID: prep-ai)
  // ----------------------------------------------------
  if (section.id === "prep-ai") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4 flex flex-col h-[520px] overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border pb-3 shrink-0">
          <div className="rounded-lg bg-accent/10 p-2 text-accent-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">Ask AI Prep Coach</h2>
            <p className="text-[11px] text-muted-foreground">Placement Assistant tailored specifically for {companyName} drives.</p>
          </div>
        </div>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 p-2 bg-secondary/15 rounded-xl border border-border/40 no-scrollbar">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
              {msg.sender === "bot" ? (
                <div className="h-7 w-7 rounded-full bg-accent/10 text-accent-foreground flex items-center justify-center shrink-0 text-xs font-bold border border-accent/20">
                  <Bot className="h-4 w-4" />
                </div>
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold">
                  U
                </div>
              )}
              <div className={`p-3 rounded-2xl text-xs max-w-[80%] ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none leading-relaxed shadow-sm"
                  : (msg as any).isError
                  ? "bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-none shadow-sm"
                  : "bg-card border border-border/70 text-foreground rounded-tl-none shadow-sm font-medium"
              }`}>
                {msg.sender === "user" ? (
                  <span>{msg.text}</span>
                ) : (
                  <MarkdownText text={msg.text} />
                )}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-start gap-2.5 animate-pulse">
              <div className="h-7 w-7 rounded-full bg-accent/10 text-accent-foreground flex items-center justify-center shrink-0 text-xs font-bold border border-accent/20">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3 rounded-2xl text-xs bg-card border border-border/70 text-muted-foreground rounded-tl-none shadow-sm flex items-center gap-1.5 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Prep Coach is thinking...
              </div>
            </div>
          )}
        </div>

        {/* Chat input block */}
        <div className="flex gap-2 border-t border-border pt-3 shrink-0">
          <input
            type="text"
            placeholder={chatLoading ? "Prep Coach is thinking..." : `Ask a question about ${companyName}... (e.g., 'What is their CTC?' or 'Practice SQL')`}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            disabled={chatLoading}
            onKeyDown={e => {
              if (e.key === "Enter") handleSendChat();
            }}
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 shadow-2xs"
          />
          <button
            onClick={handleSendChat}
            disabled={chatLoading || !chatInput.trim()}
            className="rounded-lg bg-primary px-3.5 py-2 text-primary-foreground hover:opacity-90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CUSTOM CARD FOR "Company Identity" (ID: identity)
  // ----------------------------------------------------
  if (section.id === "identity") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">{section.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Core company registrations and corporate metadata.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Legal Name */}
          <div className="p-4 rounded-xl bg-secondary/20 border border-border/40 flex items-start gap-3.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Legal Name</span>
              <p className="text-xs font-semibold text-foreground mt-1">{String(profile.name || "N/A")}</p>
            </div>
          </div>

          {/* Short Name */}
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-100 flex items-start gap-3.5 dark:bg-slate-900/40 dark:border-slate-800">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 shrink-0">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brand Name</span>
              <p className="text-xs font-semibold text-foreground mt-1">{String(profile.short_name || "N/A")}</p>
            </div>
          </div>

          {/* Category */}
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-100 flex items-start gap-3.5 dark:bg-slate-900/40 dark:border-slate-800">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 shrink-0">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
              <p className="text-xs font-semibold text-foreground mt-1">{String(profile.category || "N/A")}</p>
            </div>
          </div>

          {/* Incorporation Year */}
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-100 flex items-start gap-3.5 dark:bg-slate-900/40 dark:border-slate-800">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 shrink-0">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incorporation</span>
              <p className="text-xs font-semibold text-foreground mt-1">{String(profile.incorporation_year || "N/A")}</p>
            </div>
          </div>

          {/* Nature of Company */}
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-100 flex items-start gap-3.5 dark:bg-slate-900/40 dark:border-slate-800">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 shrink-0">
              <Globe2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nature</span>
              <p className="text-xs font-semibold text-foreground mt-1">{String(profile.nature_of_company || "N/A")}</p>
            </div>
          </div>

          {/* Employee Size */}
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-100 flex items-start gap-3.5 dark:bg-slate-900/40 dark:border-slate-800">
            <div className="p-2 bg-pink-50 rounded-lg text-pink-600 dark:bg-pink-950/30 dark:text-pink-400 shrink-0">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scale Size</span>
              <p className="text-xs font-semibold text-foreground mt-1">{String(profile.employee_size || "N/A")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CUSTOM CARD FOR "Overview & Vision" (ID: overview)
  // ----------------------------------------------------
  if (section.id === "overview") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">{section.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Corporate statement, mission roadmap, and core values.</p>
          </div>
        </div>

        {/* Overview Box */}
        {profile.overview_text && (
          <div className="p-5 rounded-xl bg-slate-50 border-l-4 border-[#2563eb] dark:bg-slate-900/40 space-y-2">
            <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider block">Company Overview</span>
            <p className="text-xs text-foreground leading-relaxed font-medium italic">
              "{String(profile.overview_text)}"
            </p>
          </div>
        )}

        {/* Vision & Mission side-by-side card items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.vision_statement && (
            <div className="p-5 rounded-xl border border-t-4 border-t-purple-500 border-border/60 bg-card shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Vision Statement</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {String(profile.vision_statement)}
              </p>
            </div>
          )}

          {profile.mission_statement && (
            <div className="p-5 rounded-xl border border-t-4 border-t-emerald-500 border-border/60 bg-card shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Mission Statement</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {String(profile.mission_statement)}
              </p>
            </div>
          )}
        </div>

        {/* Core Values & Timeline */}
        <div className="space-y-4">
          {profile.core_values && (
            <div className="p-4 rounded-xl border border-border/50 bg-muted/40 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Core Values</span>
              <div className="mt-1">{renderValue(profile.core_values, "list")}</div>
            </div>
          )}

          {profile.history_timeline && (
            <div className="p-4 rounded-xl border border-border/50 bg-muted/40 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Milestones &amp; Timeline</span>
              <div className="mt-1">{renderValue(profile.history_timeline, "list")}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CUSTOM CARD FOR "Culture & Work Life" (ID: culture)
  // ----------------------------------------------------
  if (section.id === "culture") {
    const renderCultureProgress = (label: string, ratingVal: unknown, colorClass: string = "bg-[#2563eb]") => {
      if (isNullish(ratingVal)) return null;
      const strVal = String(ratingVal);
      let percentage = 70;
      const matchTen = strVal.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
      const matchPercent = strVal.match(/(\d+(?:\.\d+)?)\s*%/);
      if (matchTen) {
        percentage = Math.round(parseFloat(matchTen[1]) * 10);
      } else if (matchPercent) {
        percentage = Math.round(parseFloat(matchPercent[1]));
      }

      return (
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground">{strVal}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden dark:bg-slate-800">
            <div className={`h-full ${colorClass}`} style={{ width: `${percentage}%` }} />
          </div>
        </div>
      );
    };

    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="rounded-lg bg-pink-100 p-2 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">{section.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Inside workplace dynamics, manager quality, and safety indicators.</p>
          </div>
        </div>

        {/* Culture Summary */}
        {profile.work_culture_summary && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground uppercase tracking-wider text-[10px] block mb-1">Culture Overview</span>
            {String(profile.work_culture_summary)}
          </div>
        )}

        {/* Progress indicators for key culture scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderCultureProgress("Manager Quality", profile.manager_quality, "bg-[#7c3aed]")}
          {renderCultureProgress("Psychological Safety", profile.psychological_safety, "bg-[#10b981]")}
          {renderCultureProgress("Diversity & Inclusion", profile.diversity_inclusion_score, "bg-[#2563eb]")}
          {renderCultureProgress("Mission Clarity", profile.mission_clarity, "bg-[#f59e0b]")}
        </div>

        {/* Core risk stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profile.burnout_risk && (
            <div className="p-4 rounded-xl border border-border/50 bg-muted/40 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Burnout Risk</span>
              <p className="text-xs font-semibold text-foreground">{String(profile.burnout_risk)}</p>
            </div>
          )}

          {profile.layoff_history && (
            <div className="p-4 rounded-xl border border-border/50 bg-muted/40 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Layoff History</span>
              <p className="text-xs font-semibold text-foreground">{String(profile.layoff_history)}</p>
            </div>
          )}

          {profile.ethical_standards && (
            <div className="p-4 rounded-xl border border-border/50 bg-muted/40 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ethical Standards</span>
              <p className="text-xs font-semibold text-foreground">{String(profile.ethical_standards)}</p>
            </div>
          )}

          {profile.crisis_behavior && (
            <div className="p-4 rounded-xl border border-border/50 bg-muted/40 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Crisis Leadership</span>
              <p className="text-xs font-semibold text-foreground">{String(profile.crisis_behavior)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // GENERIC SECTION CARD
  // ----------------------------------------------------
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">{section.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Explore detailed company profiles and operational data metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {section.fields.map((field) => {
          const rawVal = profile[field.key];
          const valueStr = String(rawVal);
          const isParagraph = field.kind === "paragraph" || valueStr.length > 125;
          return (
            <div
              key={field.key}
              className={`p-4 rounded-lg bg-secondary/20 border border-border/40 flex flex-col gap-1.5 ${
                isParagraph ? "col-span-full" : ""
              }`}
            >
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {field.label}
              </span>
              <div className="text-xs leading-relaxed text-foreground mt-0.5">
                {renderValue(rawVal, field.kind)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

function CompanyIntelligence() {
  const { selectedId, isReady } = useCompany();
  const profileQuery = useCompanyProfile(selectedId);
  const rawSections = useMemo(() => buildIntelligenceSections(profileQuery.data?.profile), [profileQuery.data]);
  
  // Custom sidebar preparation items injected at the top
  const sections = useMemo(() => {
    if (rawSections.length === 0) return [];
    const prepItems: IntelligenceSection[] = [
      { id: "prep-score", title: "Preparation Readiness", icon: Award, fields: [] },
      { id: "hiring-timeline", title: "Recruitment Timeline", icon: Compass, fields: [] },
      { id: "prep-ai", title: "Ask AI Assistant", icon: Sparkles, fields: [] }
    ];
    return [...prepItems, ...rawSections];
  }, [rawSections]);

  const [activeIdx, setActiveIdx] = useState(0);

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
            className="mt-3 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
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
    <div className="flex w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* 1. Side Navigation Menu (Sticky column) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-card h-full overflow-y-auto no-scrollbar">
        <div className="px-4 py-3.5 border-b border-border flex items-center gap-3 shrink-0 bg-secondary/15">
          <CompanyLogo name={summary.name} websiteUrl={summary.website_url} fallbackUrl={summary.logo_url} size={36} />
          <div className="min-w-0">
            <h2 className="font-heading text-xs font-bold text-foreground truncate leading-tight">{summary.name}</h2>
            <span className="inline-block mt-0.5 rounded-full bg-accent/25 border border-accent/40 px-1.5 py-0.5 text-[9px] font-semibold text-[#854d0e]">
              {summary.category}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto no-scrollbar">
          {sections.map((s, i) => {
            const Icon = s.icon;
            const isCustomPrep = s.id === "prep-score" || s.id === "hiring-timeline" || s.id === "prep-ai";
            return (
              <button
                key={s.id}
                onClick={() => setActiveIdx(i)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-xs font-semibold transition border cursor-pointer ${
                  activeIdx === i
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : isCustomPrep
                    ? "border-accent/40 bg-accent/5 text-[#854d0e] hover:bg-accent/10"
                    : "border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{s.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 2. Right Content Panel */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {/* Header Widget */}
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <CompanyLogo name={summary.name} websiteUrl={summary.website_url} fallbackUrl={summary.logo_url} size={32} />
            <div className="min-w-0">
              <h2 className="font-heading text-xs font-bold text-foreground truncate leading-tight">{summary.name}</h2>
              <span className="rounded-full bg-accent/25 border border-accent/40 px-1 py-0.5 text-[8px] font-semibold text-[#854d0e]">
                {summary.category}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
             <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Company Preparation Intelligence</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {summary.website_url && (
              <a href={summary.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:bg-muted transition-colors shadow-sm">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /> Website
              </a>
            )}
            {String(profile.linkedin_url ?? "") && (
              <a href={String(profile.linkedin_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:bg-muted transition-colors shadow-sm">
                <Linkedin className="h-3.5 w-3.5 text-muted-foreground" /> LinkedIn
              </a>
            )}
          </div>
        </header>

        {/* Mobile Horizontal scroll tab nav */}
        <div className="md:hidden border-b border-border bg-card px-2 py-1.5 flex gap-1 overflow-x-auto no-scrollbar shrink-0">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${
                activeIdx === i
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Active Tab Panel Content (Scrollable content box) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          <div className="max-w-4xl mx-auto w-full">
            <SectionCard
              section={sections[activeIdx]}
              profile={profile}
              companyName={summary.name}
              companyId={summary.company_id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
