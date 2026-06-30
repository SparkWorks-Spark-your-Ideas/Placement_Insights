import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileSearch, Sparkles, FileText, CheckCircle2, AlertCircle, RefreshCw, Check, X, Upload } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { useCompanySkills } from "@/lib/companyApi";
import { CompanyLogo } from "@/components/CompanyLogo";
import { toast } from "sonner";

export const Route = createFileRoute("/company/scan")({
  component: ResumeScanner,
});

interface MatchResult {
  score: number;
  matched: string[];
  missing: string[];
  recommendations: string[];
}

function ResumeScanner() {
  const { selected, isReady } = useCompany();
  const skillsQuery = useCompanySkills(selected?.company_id);

  const [resumeText, setResumeText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);

  if (!isReady || skillsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-2 text-sm text-muted-foreground">Loading company requirements...</p>
      </div>
    );
  }

  const skills = skillsQuery.data?.skills ?? [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain") {
      toast.error("Only plain text (.txt) files are supported in this demo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setResumeText(event.target?.result as string || "");
      toast.success("Resume text loaded successfully!");
    };
    reader.readAsText(file);
  };

  const runAnalysis = () => {
    if (!resumeText.trim()) {
      toast.error("Please paste your resume text or upload a text file.");
      return;
    }

    setScanning(true);
    setResult(null);

    // Simulate scanning steps
    const steps = [
      "Extracting text details...",
      "Matching against KITS required roadmaps...",
      "Cross-referencing skill level thresholds...",
      "Calculating ATS compatibility rating...",
    ];

    let currentStep = 0;
    setScanStep(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setScanStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        performMatching();
      }
    }, 500);
  };

  const performMatching = () => {
    const textLower = resumeText.toLowerCase();
    const matched: string[] = [];
    const missing: string[] = [];
    const recommendations: string[] = [];

    // Simple keyword mapping matching skill sets
    const skillKeywordMapping: Record<string, string[]> = {
      "data structures & algorithms": ["dsa", "algorithms", "data structures", "sorting", "searching", "trees", "graphs", "recursion"],
      "object-oriented programming": ["oop", "object-oriented", "inheritance", "polymorphism", "encapsulation", "classes", "solid"],
      "sql & databases": ["sql", "database", "querying", "joins", "indexing", "nosql", "mysql", "postgresql", "oracle"],
      "cloud fundamentals (aws/azure)": ["aws", "azure", "cloud", "serverless", "s3", "ec2", "lambda", "devops", "kubernetes", "docker"],
      "operating systems": ["operating system", "concurrency", "multithreading", "linux", "kernel", "deadlock"],
      "computer networks": ["networks", "tcp", "udp", "http", "dns", "ip address", "routing", "tls"],
      "aptitude & logical reasoning": ["analytical", "problem solving", "reasoning", "logical", "aptitude", "quantitative"],
      "communication & behavioral": ["leadership", "communication", "teamwork", "presentation", "verbal", "written", "collaboration"],
      "web development basics": ["html", "css", "javascript", "react", "node", "frontend", "backend", "web development"],
      "system design (intro)": ["system design", "scalability", "load balancing", "caching", "architecture", "microservices"],
      "git & version control": ["git", "github", "gitlab", "version control", "pull request", "branching"],
      "generative ai basics": ["generative ai", "llm", "openai", "copilot", "prompt engineering", "machine learning", "ai"],
    };

    for (const skill of skills) {
      const name = skill.skill_set_name;
      const keywords = skillKeywordMapping[name.toLowerCase()] ?? [name.toLowerCase()];
      const hasMatch = keywords.some((kw) => textLower.includes(kw));

      if (hasMatch) {
        matched.push(name);
      } else {
        missing.push(name);
        recommendations.push(
          `Include details of "${name}" (such as: ${keywords.slice(0, 3).join(", ")}) to align with the required Level ${skill.required_level} standards.`
        );
      }
    }

    // Calculate score
    const totalSkills = skills.length;
    const matchedCount = matched.length;
    let baseScore = totalSkills > 0 ? (matchedCount / totalSkills) * 100 : 0;

    // Add minor bonuses for generic ATS terms
    if (textLower.includes("project")) baseScore += 2;
    if (textLower.includes("experience")) baseScore += 2;
    if (textLower.includes("education")) baseScore += 2;
    if (textLower.includes("certif")) baseScore += 2;

    const finalScore = Math.min(Math.round(baseScore), 100);

    setResult({
      score: finalScore,
      matched,
      missing,
      recommendations: recommendations.length > 0 
        ? recommendations 
        : ["Your resume matches all required skill keywords! Excellent job optimizing it for this company."],
    });
    setScanning(false);
    toast.success("Resume analysis complete!");
  };

  const getScoreStyles = (score: number) => {
    if (score >= 80) return { text: "text-emerald-700", border: "border-emerald-500", bg: "bg-emerald-50" };
    if (score >= 50) return { text: "text-amber-700", border: "border-amber-500", bg: "bg-amber-50" };
    return { text: "text-rose-700", border: "border-rose-500", bg: "bg-rose-50" };
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
      
      {/* Header Profile Info */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <CompanyLogo name={selected?.name || ""} websiteUrl={selected?.website_url} fallbackUrl={selected?.logo_url} size={44} />
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" /> Resume Scanner &amp; Matcher
            </h1>
            <p className="text-xs text-muted-foreground">
              Optimize your resume keyword alignment for <span className="font-semibold text-foreground">{selected?.name}</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            
            {/* Custom Drag & Drop File Upload Area */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-primary" /> Drag or Upload Resume
              </span>
              <div className="relative border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-5 text-center transition bg-secondary/20 flex flex-col items-center justify-center group">
                <input
                  type="file"
                  accept=".txt"
                  id="file-upload"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileText className="h-8 w-8 text-muted-foreground group-hover:scale-105 transition mb-2" />
                <p className="text-xs font-semibold text-foreground">Upload plain text (.txt) file</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Click here or drag file to parse contents</p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="resume-textarea" className="text-xs font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Paste Resume Text
              </label>
              <textarea
                id="resume-textarea"
                rows={10}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the full text of your resume here (Ctrl+V)..."
                className="w-full rounded-lg border border-border bg-card p-4 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition font-mono resize-none shadow-2xs"
              />
            </div>

            <button
              onClick={runAnalysis}
              disabled={scanning}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {scanning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{scanStep}</span>
                </>
              ) : (
                <>
                  <FileSearch className="h-4 w-4" />
                  <span>Analyze ATS Match Score</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: ATS Report Output */}
        <div className="space-y-4">
          {result ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-5">
              <div className="text-center space-y-2">
                <h3 className="font-heading font-bold text-sm text-foreground">ATS Compatibility Rating</h3>
                <div className={`inline-flex items-center justify-center rounded-full border-4 w-24 h-24 font-heading text-3xl font-extrabold shadow-2xs ${getScoreStyles(result.score).text} ${getScoreStyles(result.score).border} ${getScoreStyles(result.score).bg}`}>
                  {result.score}%
                </div>
              </div>

              {/* Matched vs Missing */}
              <div className="space-y-4 pt-2 border-t border-border/60">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-foreground block">
                    Matched Skills ({result.matched.length})
                  </span>
                  {result.matched.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {result.matched.map((m) => (
                        <span key={m} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[9px] font-bold text-emerald-800">
                          <Check className="h-2.5 w-2.5" /> {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">No matches found. Try pasting your full technical resume.</span>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-foreground block">
                    Missing Skills ({result.missing.length})
                  </span>
                  {result.missing.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {result.missing.map((m) => (
                        <span key={m} className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 text-[9px] font-bold text-rose-800">
                          <X className="h-2.5 w-2.5" /> {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-emerald-700 font-bold">100% matched! Excellent.</span>
                  )}
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="border-t border-border/60 pt-4">
                <h4 className="font-heading font-bold text-xs text-foreground flex items-center gap-1 mb-3">
                  <AlertCircle className="h-4 w-4 text-primary" /> Actionable Advice
                </h4>
                <ul className="space-y-2 text-[10px] text-muted-foreground pl-1.5 leading-normal">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex gap-2 items-start bg-secondary/25 border border-border/30 rounded-lg p-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FileSearch className="h-10 w-10 text-muted-foreground opacity-30 mb-3" />
              <h3 className="font-heading font-semibold text-xs text-foreground">Awaiting Scan</h3>
              <p className="text-[10px] mt-1 max-w-[200px] leading-relaxed">
                Paste your resume text or upload a plain text file on the left and click analyze to see your keyword compatibility score.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
