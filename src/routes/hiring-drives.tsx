import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays, Briefcase, DollarSign, Calendar, Users, PlusCircle, Trash2, ShieldCheck, XCircle, ArrowLeft
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import {
  useHiringDrives, useStudentRegistrations, useRegisterForDrive, useUnregisterFromDrive,
  useCreateHiringDrive, useDriveRegistrations, type HiringDrive
} from "@/lib/companyApi";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CompanyLogo } from "@/components/CompanyLogo";

export const Route = createFileRoute("/hiring-drives")({
  component: ActiveHiringDrives,
});

function ActiveHiringDrives() {
  const { profile } = useAuth();
  const { companies } = useCompany();

  // Queries
  const drivesQuery = useHiringDrives();
  const studentRegsQuery = useStudentRegistrations(profile?.id);

  // Mutations
  const registerMutation = useRegisterForDrive();
  const unregisterMutation = useUnregisterFromDrive();
  const createDriveMutation = useCreateHiringDrive();

  // Admin state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDriveForRegs, setSelectedDriveForRegs] = useState<HiringDrive | null>(null);

  // Form state
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [ctc, setCtc] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");

  const isAdminOrOfficer = profile?.role === "admin" || profile?.role === "officer";

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !title || !deadline) {
      toast.error("Please fill in all required fields (Company, Title, Deadline).");
      return;
    }

    try {
      await createDriveMutation.mutateAsync({
        company_id: Number(companyId),
        title,
        eligibility,
        ctc,
        deadline,
        description,
      });
      toast.success("New placement drive posted successfully!");
      setShowAddForm(false);
      // Reset form
      setCompanyId("");
      setTitle("");
      setEligibility("");
      setCtc("");
      setDeadline("");
      setDescription("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create placement drive.");
    }
  };

  const handleRegister = async (driveId: string) => {
    if (!profile?.id) return;
    try {
      await registerMutation.mutateAsync({ driveId, studentId: profile.id });
      toast.success("Successfully registered for this hiring drive!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to register. Make sure you ran sql/hiring_drives_schema.sql.");
    }
  };

  const handleUnregister = async (driveId: string) => {
    if (!profile?.id) return;
    try {
      await unregisterMutation.mutateAsync({ driveId, studentId: profile.id });
      toast.success("Successfully withdrawn your application.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to withdraw application.");
    }
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
              <span className="min-w-0 truncate font-medium text-foreground">Active Drives</span>
            </nav>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden p-6 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <CalendarDays className="h-6 w-6 text-[#2563eb]" /> KITS Active Hiring Drives
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  View and register for active placement campaigns posted by the Placement Cell.
                </p>
              </div>
              {isAdminOrOfficer && !selectedDriveForRegs && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                >
                  <PlusCircle className="h-4 w-4" /> {showAddForm ? "Cancel" : "Post Placement Drive"}
                </button>
              )}
            </div>

            {/* Placement Officer: View Registrations Modal View */}
            {selectedDriveForRegs ? (
              <RegistrationsView drive={selectedDriveForRegs} onClose={() => setSelectedDriveForRegs(null)} />
            ) : showAddForm && isAdminOrOfficer ? (
              /* Placement Officer: Add Hiring Campaign Form */
              <form onSubmit={handleCreateDrive} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-xl">
                <h3 className="font-heading font-bold text-sm text-foreground">Post New Hiring Campaign</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">Target Company *</label>
                    <select
                      required
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background p-2.5 outline-none focus:border-[#2563eb] transition"
                    >
                      <option value="">Select company...</option>
                      {companies.map((c) => (
                        <option key={c.company_id} value={c.company_id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">Drive Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Associate Software Engineer (ASE)"
                      className="w-full rounded-lg border border-border bg-background p-2.5 outline-none focus:border-[#2563eb] transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-muted-foreground font-medium mb-1">CTC Offer Package</label>
                      <input
                        type="text"
                        value={ctc}
                        onChange={(e) => setCtc(e.target.value)}
                        placeholder="e.g. 6.5 LPA"
                        className="w-full rounded-lg border border-border bg-background p-2.5 outline-none focus:border-[#2563eb] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground font-medium mb-1">Registration Deadline *</label>
                      <input
                        type="date"
                        required
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background p-2.5 outline-none focus:border-[#2563eb] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">Eligibility Criteria</label>
                    <input
                      type="text"
                      value={eligibility}
                      onChange={(e) => setEligibility(e.target.value)}
                      placeholder="e.g. CGPA >= 7.0, B.Tech CSE/ECE"
                      className="w-full rounded-lg border border-border bg-background p-2.5 outline-none focus:border-[#2563eb] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">Job Description</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Role summary, requirements, and tech stacks required..."
                      className="w-full rounded-lg border border-border bg-background p-2.5 outline-none focus:border-[#2563eb] transition resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    Publish Campaign
                  </button>
                </div>
              </form>
            ) : (
              /* Standard Hiring Drives Listing */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivesQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-muted" />
                  ))
                ) : (drivesQuery.data ?? []).length === 0 ? (
                  <div className="md:col-span-2 rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground flex flex-col items-center">
                    <Calendar className="h-12 w-12 opacity-35 mb-3 text-muted-foreground" />
                    <h3 className="font-heading font-semibold text-sm text-foreground">No Active Placement Drives</h3>
                    <p className="text-xs mt-1 max-w-[280px] leading-relaxed">
                      Placement officers haven't posted any drives yet, or you haven't run the `hiring_drives_schema.sql` database migration.
                    </p>
                  </div>
                ) : (
                  (drivesQuery.data ?? []).map((drive) => {
                    const isRegistered = studentRegsQuery.data?.includes(drive.id) ?? false;
                    const formattedDeadline = new Date(drive.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const isExpired = new Date(drive.deadline) < new Date();

                    return (
                      <div key={drive.id} className="relative rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-3">
                              {drive.company && (
                                <CompanyLogo
                                  name={drive.company.name}
                                  websiteUrl={drive.company.website_url}
                                  fallbackUrl={drive.company.logo_url}
                                  size={40}
                                />
                              )}
                              <div>
                                <h3 className="font-heading font-bold text-foreground text-sm line-clamp-1">{drive.title}</h3>
                                <span className="text-xs text-muted-foreground font-medium">{drive.company?.name}</span>
                              </div>
                            </div>
                            {isRegistered && (
                              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-950/20 dark:border-green-900/40">
                                <ShieldCheck className="h-3 w-3" /> Registered
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-2.5 rounded-lg">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <DollarSign className="h-3.5 w-3.5 text-[#16a34a]" />
                              <div>
                                <span className="block text-[10px] opacity-75 font-medium">CTC Package</span>
                                <span className="font-semibold text-foreground">{drive.ctc || "NA"}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 text-red-500" />
                              <div>
                                <span className="block text-[10px] opacity-75 font-medium">Deadline</span>
                                <span className="font-semibold text-foreground">{formattedDeadline}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs space-y-1">
                            <span className="font-semibold text-foreground block">Eligibility:</span>
                            <p className="text-muted-foreground leading-normal">{drive.eligibility || "Open to all branches"}</p>
                          </div>

                          <div className="text-xs space-y-1">
                            <span className="font-semibold text-foreground block">Job Description:</span>
                            <p className="text-muted-foreground leading-normal line-clamp-2">{drive.description || "No details provided"}</p>
                          </div>
                        </div>

                        {/* Drive Card Actions */}
                        <div className="mt-5 border-t border-border/60 pt-4 flex gap-2 justify-between items-center">
                          {isAdminOrOfficer ? (
                            <button
                              onClick={() => setSelectedDriveForRegs(drive)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                            >
                              <Users className="h-4 w-4" /> View Registrations
                            </button>
                          ) : (
                            <div />
                          )}

                          {isRegistered ? (
                            <button
                              onClick={() => handleUnregister(drive.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/10"
                            >
                              <XCircle className="h-4 w-4" /> Withdraw
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRegister(drive.id)}
                              disabled={isExpired}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                            >
                              Register Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Subcomponent: Display table of registered students for a drive
function RegistrationsView({ drive, onClose }: { drive: HiringDrive; onClose: () => void }) {
  const regsQuery = useDriveRegistrations(drive.id);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="rounded-md border border-border bg-background p-1.5 hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h3 className="font-heading font-bold text-sm text-foreground">Registered Students</h3>
          <p className="text-xs text-muted-foreground">{drive.title} ({drive.company?.name})</p>
        </div>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg bg-card text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <th className="p-3">Student Name</th>
              <th className="p-3">Email Address</th>
              <th className="p-3">Registration Date</th>
            </tr>
          </thead>
          <tbody>
            {regsQuery.isLoading ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted-foreground animate-pulse">Loading registrations list...</td>
              </tr>
            ) : (regsQuery.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted-foreground italic">No students have registered for this drive yet.</td>
              </tr>
            ) : (
              (regsQuery.data ?? []).map((row) => {
                const formattedDate = new Date(row.registered_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="p-3 font-medium text-foreground">{row.full_name}</td>
                    <td className="p-3 text-muted-foreground">{row.email}</td>
                    <td className="p-3 text-muted-foreground">{formattedDate}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
