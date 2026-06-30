import { useEffect } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, needsOnboarding } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === "/login" || pathname === "/signup";

    if (!user && !isAuthRoute) {
      navigate({ to: "/login", replace: true });
    } else if (user && isAuthRoute) {
      navigate({ to: "/", replace: true });
    }
  }, [user, loading, pathname, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Verifying credentials...
          </p>
        </div>
      </div>
    );
  }

  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  if (!user && !isAuthRoute) return null;
  if (user && isAuthRoute) return null;

  if (user && needsOnboarding && !isAuthRoute) {
    return <OnboardingWizard />;
  }

  return <>{children}</>;
}
