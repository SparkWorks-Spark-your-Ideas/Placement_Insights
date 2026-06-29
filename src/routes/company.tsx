import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useCompany } from "@/context/CompanyContext";

export const Route = createFileRoute("/company")({
  component: CompanyLayout,
});

function CompanyLayout() {
  const { selected, isReady, companiesLoaded } = useCompany();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReady && companiesLoaded && !selected) {
      navigate({ to: "/" });
    }
  }, [companiesLoaded, isReady, selected, navigate]);

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
              <span className="min-w-0 truncate font-medium text-foreground">{selected?.name ?? "Company"}</span>
            </nav>
          </header>
          <main className="min-w-0 flex-1 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
