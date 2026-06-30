import { useState, useEffect } from "react";
import { useUpdateOnboarding, useAvailableRoles, useSkillsMaster } from "@/lib/companyApi";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Briefcase, GraduationCap, ArrowRight, ArrowLeft, Check, Sparkles, X, Brain, Cpu, Pocket } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { MercuryBackground } from "@/components/ui/mercury-background";

const DEFAULT_ROLES = [
  "Associate Software Engineer (ASE)",
  "Advanced Associate Software Engineer (AASE)",
  "Software Engineer (SE)",
  "Data Analyst / Scientist",
  "DevOps & Cloud Engineer",
  "Full Stack Developer",
  "Database Administrator (DBA)",
  "Generative AI Consultant",
  "Network Security Engineer",
];

const getSkillDesc = (name: string) => {
  const clean = name.toLowerCase();
  if (clean.includes("data structures") || clean.includes("dsa")) {
    return "Arrays, Trees, Graphs, Sorting, Dynamic Programming";
  }
  if (clean.includes("oop") || clean.includes("object-oriented")) {
    return "Classes, Inheritance, Polymorphism, SOLID principles";
  }
  if (clean.includes("sql") || clean.includes("database")) {
    return "Queries, Joins, Normalization, ACID Transactions";
  }
  if (clean.includes("cloud") || clean.includes("devops")) {
    return "EC2, S3, IAM, Serverless, Cloud Deployments";
  }
  if (clean.includes("operating system") || clean.includes("os")) {
    return "Process Management, Threading, Virtual Memory, Scheduling";
  }
  if (clean.includes("network")) {
    return "TCP/IP, HTTP, OSI Model, DNS, Socket Programming";
  }
  if (clean.includes("aptitude") || clean.includes("reasoning")) {
    return "Quantitative Aptitude, Puzzles, Logic Deduction";
  }
  if (clean.includes("communication") || clean.includes("behavioral")) {
    return "HR questions, Verbal fluency, Leadership scenarios";
  }
  if (clean.includes("web") || clean.includes("coding") || clean.includes("development")) {
    return "HTML5, CSS3, ES6 JavaScript, DOM Manipulation";
  }
  if (clean.includes("system design")) {
    return "Caching, Load Balancers, Sharding, Microservices";
  }
  if (clean.includes("git") || clean.includes("version")) {
    return "Branching, Merging, Rebase, Pull Requests";
  }
  if (clean.includes("ai") || clean.includes("generative")) {
    return "LLMs, Prompt Engineering, Retrieval-Augmented Generation";
  }
  return "Self-assess your level from 1 to 10.";
};

interface OnboardingWizardProps {
  isDismissible?: boolean;
  onClose?: () => void;
}

export function OnboardingWizard({ isDismissible = false, onClose }: OnboardingWizardProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [packageLpa, setPackageLpa] = useState<number>(6.5);
  const [batchYear, setBatchYear] = useState<number>(2026);
  const [targetRole, setTargetRole] = useState<string>("");
  const [customRole, setCustomRole] = useState<string>("");
  const [isCustomRole, setIsCustomRole] = useState(false);

  // Ratings state dynamically populated from database
  const [skills, setSkills] = useState<Record<string, number>>({});

  const { data: dbRoles } = useAvailableRoles();
  const { data: skillsMaster, isLoading: isSkillsMasterLoading } = useSkillsMaster();
  const updateMutation = useUpdateOnboarding();

  // Populate dynamic skills master options
  useEffect(() => {
    if (skillsMaster && skillsMaster.length > 0) {
      setSkills((prev) => {
        const initial = { ...prev };
        for (const s of skillsMaster) {
          if (initial[s.skill_set_name] === undefined) {
            initial[s.skill_set_name] = 5;
          }
        }
        return initial;
      });
    }
  }, [skillsMaster]);

  // Populate initial values if profile exists (for updating profile mode)
  useEffect(() => {
    if (profile) {
      if (profile.package_lpa) setPackageLpa(Number(profile.package_lpa));
      if (profile.batch_year) setBatchYear(Number(profile.batch_year));
      if (profile.target_role) {
        const role = String(profile.target_role);
        if (DEFAULT_ROLES.includes(role) || (dbRoles && dbRoles.includes(role))) {
          setTargetRole(role);
          setIsCustomRole(false);
        } else {
          setTargetRole("other");
          setCustomRole(role);
          setIsCustomRole(true);
        }
      }
    }
  }, [profile, dbRoles]);

  // Load existing student skill levels if editing
  useEffect(() => {
    const fetchExistingSkills = async () => {
      if (profile?.id && skillsMaster && skillsMaster.length > 0) {
        const { supabase } = await import("@/lib/supabaseClient");
        if (!supabase) return;
        const { data } = await supabase
          .from("student_skills")
          .select("skill_set_name, current_level")
          .eq("student_id", profile.id);
        
        if (data && data.length > 0) {
          const validNames = new Set(skillsMaster.map(s => s.skill_set_name));
          setSkills((prev) => {
            const loaded = { ...prev };
            for (const row of data) {
              if (validNames.has(row.skill_set_name)) {
                loaded[row.skill_set_name] = Number(row.current_level);
              }
            }
            return loaded;
          });
        }
      }
    };
    fetchExistingSkills();
  }, [profile?.id, skillsMaster]);

  const uniqueRoles = Array.from(
    new Set([...DEFAULT_ROLES, ...(dbRoles ?? [])])
  );

  const handleRoleChange = (val: string) => {
    setTargetRole(val);
    if (val === "other") {
      setIsCustomRole(true);
    } else {
      setIsCustomRole(false);
    }
  };

  const handleSkillChange = (skillName: string, val: number[]) => {
    setSkills((prev) => ({ ...prev, [skillName]: val[0] }));
  };

  const handleNext = () => {
    if (step === 1) {
      const selectedRole = isCustomRole ? customRole : targetRole;
      if (!selectedRole || !selectedRole.trim()) {
        toast.error("Please select or enter your target job profile.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const selectedRole = isCustomRole ? customRole : targetRole;
      const skillsArray = Object.entries(skills).map(([name, level]) => ({
        skillName: name,
        level,
      }));

      await updateMutation.mutateAsync({
        packageLpa,
        batchYear,
        targetRole: selectedRole,
        skills: skillsArray,
      });

      toast.success("Placement onboarding configuration saved successfully!");
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile expectations.");
    }
  };

  // Get placement package category
  const getPackageTier = (lpa: number) => {
    if (lpa < 5) return { name: "Standard Level", color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50" };
    if (lpa < 8) return { name: "Dream Target", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50" };
    if (lpa < 15) return { name: "Super Dream Target", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50" };
    return { name: "Product Elite Tier", color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50" };
  };

  const currentTier = getPackageTier(packageLpa);

  // Group fetched skills dynamically
  const algoGroup = skillsMaster ? skillsMaster.slice(0, 4) : [];
  const systemGroup = skillsMaster ? skillsMaster.slice(4, 8) : [];
  const softGroup = skillsMaster ? skillsMaster.slice(8, 12) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] px-4 py-6 overflow-y-auto font-sans text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;800&family=Space+Mono&display=swap');

        .onboarding-wrapper {
          font-family: 'Inter', sans-serif;
          color: #ffffff;
        }

        .onboarding-mono {
          font-family: 'Space Mono', monospace !important;
        }

        .onboarding-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 640px;
          background: #050505;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 0;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .onboarding-header h1 {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: 3rem;
          line-height: 0.9;
          letter-spacing: -2px;
          margin-top: 0;
          margin-bottom: 20px;
        }

        /* Form Elements */
        .onboarding-group {
          position: relative;
          margin-bottom: 25px;
          transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
        }

        .onboarding-group:focus-within {
          transform: translateX(10px);
        }

        .onboarding-group label {
          display: block;
          font-family: 'Space Mono', monospace !important;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .onboarding-group input, 
        .onboarding-group select,
        .onboarding-group select option {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 10px 0;
          font-size: 16px;
          outline: none;
          transition: border-color 0.4s;
          font-family: 'Space Mono', monospace !important;
        }

        .onboarding-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0%;
          height: 2px;
          background: #e0e0e0;
          transition: width 0.6s cubic-bezier(0.2, 1, 0.3, 1);
          box-shadow: 0 0 15px #e0e0e0;
        }

        .onboarding-group input:focus + .onboarding-glow,
        .onboarding-group select:focus + .onboarding-glow {
          width: 100%;
        }

        /* White Pill Button */
        .onboarding-btn {
          background: #ffffff;
          color: #000000;
          border: none;
          padding: 15px 30px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          transition: letter-spacing 0.3s, transform 0.2s;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
        }

        .onboarding-btn:hover {
          letter-spacing: 3px;
        }

        .onboarding-btn-outline {
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 15px 30px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          transition: color 0.3s, border-color 0.3s;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
        }

        .onboarding-btn-outline:hover {
          color: #ffffff;
          border-color: #ffffff;
        }

        .onboarding-skill-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 0;
          position: relative;
        }

        .onboarding-progress-bar {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          width: 100%;
        }

        .onboarding-progress-fill {
          height: 1px;
          background: #ffffff;
          transition: width 0.3s ease;
        }
      `}</style>

      {/* Dynamic Liquid gooey physics background */}
      <MercuryBackground opacity={0.65} />

      <div className="onboarding-card onboarding-wrapper">
        {/* Dismiss Option */}
        {isDismissible && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition duration-150 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="onboarding-header">
          <span className="onboarding-mono text-[9px] tracking-[4px] uppercase opacity-50 block mb-2">PLACEMENT PORTAL: 0X2026</span>
          <h1>KITS ONBOARDING</h1>
          <p className="onboarding-mono text-[11px] opacity-40 uppercase tracking-wider">
            Configure expectations and skill vectors
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="flex gap-2 my-6">
          <div className="flex-1 space-y-1">
            <span className="onboarding-mono text-[8px] opacity-30 uppercase tracking-widest block">Expectations</span>
            <div className="onboarding-progress-bar">
              <div className="onboarding-progress-fill" style={{ width: step >= 1 ? "100%" : "0%" }} />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <span className="onboarding-mono text-[8px] opacity-30 uppercase tracking-widest block">Algorithms</span>
            <div className="onboarding-progress-bar">
              <div className="onboarding-progress-fill" style={{ width: step >= 2 ? "100%" : "0%" }} />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <span className="onboarding-mono text-[8px] opacity-30 uppercase tracking-widest block">Systems</span>
            <div className="onboarding-progress-bar">
              <div className="onboarding-progress-fill" style={{ width: step >= 3 ? "100%" : "0%" }} />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <span className="onboarding-mono text-[8px] opacity-30 uppercase tracking-widest block">Soft Skills</span>
            <div className="onboarding-progress-bar">
              <div className="onboarding-progress-fill" style={{ width: step >= 4 ? "100%" : "0%" }} />
            </div>
          </div>
        </div>

        <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1 pb-4 no-scrollbar">
          
          {/* STEP 1: Expectations */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="onboarding-group">
                <label>Target Job Profile / Role</label>
                <select 
                  value={targetRole} 
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="cursor-pointer"
                >
                  <option value="" className="bg-[#050505] text-white">SELECT TARGET ROLE...</option>
                  {uniqueRoles.map((role) => (
                    <option key={role} value={role} className="bg-[#050505] text-white">{role.toUpperCase()}</option>
                  ))}
                  <option value="other" className="bg-[#050505] text-white">OTHER / CUSTOM ROLE...</option>
                </select>
                <div className="onboarding-glow"></div>

                {isCustomRole && (
                  <div className="onboarding-group mt-4">
                    <label>Specify Custom Role</label>
                    <input
                      placeholder="CUSTOM PROFILE..."
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      className="animate-in slide-in-from-top-1.5 duration-150"
                    />
                    <div className="onboarding-glow"></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="onboarding-group">
                  <label>Graduation Batch Year</label>
                  <select 
                    value={String(batchYear)} 
                    onChange={(e) => setBatchYear(Number(e.target.value))}
                    className="cursor-pointer"
                  >
                    <option value="2024" className="bg-[#050505] text-white">BATCH OF 2024</option>
                    <option value="2025" className="bg-[#050505] text-white">BATCH OF 2025</option>
                    <option value="2026" className="bg-[#050505] text-white">BATCH OF 2026</option>
                    <option value="2027" className="bg-[#050505] text-white">BATCH OF 2027</option>
                    <option value="2028" className="bg-[#050505] text-white">BATCH OF 2028</option>
                  </select>
                  <div className="onboarding-glow"></div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center onboarding-mono text-[10px] tracking-wide">
                    <span className="opacity-50">TARGET PACKAGE (LPA)</span>
                    <span className="text-white font-bold">{packageLpa} LPA</span>
                  </div>
                  <div className="pt-1">
                    <Slider
                      min={3}
                      max={40}
                      step={0.5}
                      value={[packageLpa]}
                      onValueChange={(val) => setPackageLpa(val[0])}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between onboarding-mono text-[9px] opacity-40 mt-1">
                      <span>3.0 LPA</span>
                      <span>15.0 LPA</span>
                      <span>30.0 LPA</span>
                      <span>40.0 LPA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Algorithms */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {isSkillsMasterLoading ? (
                <div className="h-32 animate-pulse bg-white/5 border border-white/10" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {algoGroup.map((skill) => (
                    <div key={skill.skill_set_name} className="onboarding-skill-card space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                          <span className="onboarding-mono text-xs font-bold text-white block truncate uppercase tracking-wider">
                            {skill.skill_set_name}
                          </span>
                          <span className="onboarding-mono text-[9px] opacity-40 block truncate mt-0.5 uppercase tracking-wide">
                            {getSkillDesc(skill.skill_set_name)}
                          </span>
                        </div>
                        <span className="onboarding-mono text-[9px] font-bold text-white border border-white/20 px-1.5 py-0.5 shrink-0">
                          LVL {skills[skill.skill_set_name] ?? 5}
                        </span>
                      </div>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[skills[skill.skill_set_name] ?? 5]}
                        onValueChange={(val) => handleSkillChange(skill.skill_set_name, val)}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Systems */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {isSkillsMasterLoading ? (
                <div className="h-32 animate-pulse bg-white/5 border border-white/10" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {systemGroup.map((skill) => (
                    <div key={skill.skill_set_name} className="onboarding-skill-card space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                          <span className="onboarding-mono text-xs font-bold text-white block truncate uppercase tracking-wider">
                            {skill.skill_set_name}
                          </span>
                          <span className="onboarding-mono text-[9px] opacity-40 block truncate mt-0.5 uppercase tracking-wide">
                            {getSkillDesc(skill.skill_set_name)}
                          </span>
                        </div>
                        <span className="onboarding-mono text-[9px] font-bold text-white border border-white/20 px-1.5 py-0.5 shrink-0">
                          LVL {skills[skill.skill_set_name] ?? 5}
                        </span>
                      </div>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[skills[skill.skill_set_name] ?? 5]}
                        onValueChange={(val) => handleSkillChange(skill.skill_set_name, val)}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Soft skills */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {isSkillsMasterLoading ? (
                <div className="h-32 animate-pulse bg-white/5 border border-white/10" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {softGroup.map((skill) => (
                    <div key={skill.skill_set_name} className="onboarding-skill-card space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                          <span className="onboarding-mono text-xs font-bold text-white block truncate uppercase tracking-wider">
                            {skill.skill_set_name}
                          </span>
                          <span className="onboarding-mono text-[9px] opacity-40 block truncate mt-0.5 uppercase tracking-wide">
                            {getSkillDesc(skill.skill_set_name)}
                          </span>
                        </div>
                        <span className="onboarding-mono text-[9px] font-bold text-white border border-white/20 px-1.5 py-0.5 shrink-0">
                          LVL {skills[skill.skill_set_name] ?? 5}
                        </span>
                      </div>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[skills[skill.skill_set_name] ?? 5]}
                        onValueChange={(val) => handleSkillChange(skill.skill_set_name, val)}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center border-t border-white/10 pt-6 mt-4">
          {step > 1 ? (
            <button
              onClick={handlePrev}
              className="onboarding-btn-outline gap-1.5 cursor-pointer animate-in fade-in"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> BACK
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="onboarding-btn gap-1.5 cursor-pointer ml-auto"
            >
              NEXT STEPS <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="onboarding-btn gap-1.5 cursor-pointer ml-auto"
            >
              {updateMutation.isPending ? "SAVING..." : "SAVE & COMPLETE"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
