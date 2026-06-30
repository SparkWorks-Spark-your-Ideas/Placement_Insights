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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <Card className="w-full max-w-2xl border-none shadow-2xl bg-card text-card-foreground overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Dismiss Option */}
        {isDismissible && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition duration-150"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        )}

        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        
        <CardHeader className="space-y-1.5 pb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="font-heading text-lg font-bold text-foreground">
                KITS Placement Onboarding
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Configure your career targets and self-assessed skill levels.
              </CardDescription>
            </div>
          </div>
          
          {/* Progress Indicators */}
          <div className="flex gap-1.5 pt-3">
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? "bg-blue-600" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? "bg-indigo-600" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 3 ? "bg-indigo-600" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 4 ? "bg-purple-600" : "bg-muted"}`} />
          </div>
        </CardHeader>

        <CardContent className="space-y-5 max-h-[62vh] overflow-y-auto pr-1 pb-4">
          
          {/* STEP 1: Expectations */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  Step 1: Placement Expectations
                </h3>
                <p className="text-xs text-muted-foreground">
                  Define your targeted package and role settings.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Target Job Profile / Role
                  </Label>
                  <Select value={targetRole} onValueChange={handleRoleChange}>
                    <SelectTrigger id="role-select" className="h-10 text-xs bg-muted/20 border-border">
                      <SelectValue placeholder="Select target role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueRoles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                      <SelectItem value="other">Other / Custom Role...</SelectItem>
                    </SelectContent>
                  </Select>

                  {isCustomRole && (
                    <Input
                      placeholder="Type your custom target job role..."
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      className="h-10 text-xs border-border bg-muted/20 mt-2 animate-in slide-in-from-top-1.5 duration-150"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2">
                    <Label htmlFor="batch" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Graduation Batch Year
                    </Label>
                    <Select value={String(batchYear)} onValueChange={(val) => setBatchYear(Number(val))}>
                      <SelectTrigger id="batch" className="h-10 text-xs bg-muted/20 border-border">
                        <SelectValue placeholder="Select graduation batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">Batch of 2024</SelectItem>
                        <SelectItem value="2025">Batch of 2025</SelectItem>
                        <SelectItem value="2026">Batch of 2026</SelectItem>
                        <SelectItem value="2027">Batch of 2027</SelectItem>
                        <SelectItem value="2028">Batch of 2028</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Target Package (LPA)
                      </Label>
                      <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 transition ${currentTier.color}`}>
                        {packageLpa} LPA · {currentTier.name}
                      </span>
                    </div>
                    <div className="pt-2">
                      <Slider
                        min={3}
                        max={40}
                        step={0.5}
                        value={[packageLpa]}
                        onValueChange={(val) => setPackageLpa(val[0])}
                        className="py-1 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-medium">
                        <span>3.0 LPA</span>
                        <span>15.0 LPA</span>
                        <span>30.0 LPA</span>
                        <span>40.0 LPA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Algorithms */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                  <Brain className="h-4 w-4 text-indigo-500" />
                  Step 2: Algorithms &amp; Databases
                </h3>
                <p className="text-xs text-muted-foreground">
                  Rate your foundations in problem solving and data management.
                </p>
              </div>

              {isSkillsMasterLoading ? (
                <div className="h-32 animate-pulse bg-muted/20 border border-border/40 rounded-xl" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {algoGroup.map((skill) => (
                    <div key={skill.skill_set_name} className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-foreground block truncate">
                            {skill.skill_set_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                            {getSkillDesc(skill.skill_set_name)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5 dark:bg-indigo-950/20 dark:border-indigo-900/50 shrink-0">
                          Lvl {skills[skill.skill_set_name] ?? 5}
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
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-indigo-500" />
                  Step 3: Systems &amp; Infrastructure
                </h3>
                <p className="text-xs text-muted-foreground">
                  Rate your core systems architectures and hosting capabilities.
                </p>
              </div>

              {isSkillsMasterLoading ? (
                <div className="h-32 animate-pulse bg-muted/20 border border-border/40 rounded-xl" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {systemGroup.map((skill) => (
                    <div key={skill.skill_set_name} className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-foreground block truncate">
                            {skill.skill_set_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                            {getSkillDesc(skill.skill_set_name)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5 dark:bg-indigo-950/20 dark:border-indigo-900/50 shrink-0">
                          Lvl {skills[skill.skill_set_name] ?? 5}
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
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  Step 4: Engineering Tools &amp; Soft Skills
                </h3>
                <p className="text-xs text-muted-foreground">
                  Rate your familiarity with developer tools and professional interaction.
                </p>
              </div>

              {isSkillsMasterLoading ? (
                <div className="h-32 animate-pulse bg-muted/20 border border-border/40 rounded-xl" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {softGroup.map((skill) => (
                    <div key={skill.skill_set_name} className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-foreground block truncate">
                            {skill.skill_set_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                            {getSkillDesc(skill.skill_set_name)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5 dark:bg-indigo-950/20 dark:border-indigo-900/50 shrink-0">
                          Lvl {skills[skill.skill_set_name] ?? 5}
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

        </CardContent>

        <CardFooter className="flex justify-between items-center border-t border-border pt-4 bg-muted/10">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="text-xs font-semibold h-9 px-4 gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 transition-colors shadow-sm ml-auto"
            >
              Next Steps <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold h-9 px-5 gap-1.5 transition-all shadow-md ml-auto"
            >
              {updateMutation.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving config...
                </>
              ) : (
                <>
                  Save &amp; Complete <Check className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
