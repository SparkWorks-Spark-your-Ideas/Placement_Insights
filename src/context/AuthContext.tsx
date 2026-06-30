import { createContext, useContext, useEffect, useState } from "react";
import { type Session, type User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "officer" | "admin";
  created_at: string;
  package_lpa?: number | null;
  placement_status?: "placed" | "pending" | null;
  batch_year?: number | null;
  target_role?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  skillsCount: number | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skillsCount, setSkillsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      return data as UserProfile | null;
    } catch (err) {
      console.error("Exception fetching profile:", err);
      return null;
    }
  };

  const fetchSkillsCount = async (userId: string) => {
    if (!supabase) return 0;
    try {
      const { count, error } = await supabase
        .from("student_skills")
        .select("*", { count: "exact", head: true })
        .eq("student_id", userId);
      if (error) {
        console.error("Error fetching skills count:", error);
        return 0;
      }
      return count ?? 0;
    } catch (err) {
      console.error("Exception fetching skills count:", err);
      return 0;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const [prof, sc] = await Promise.all([
        fetchProfile(user.id),
        fetchSkillsCount(user.id)
      ]);
      setProfile(prof);
      setSkillsCount(sc);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const [prof, sc] = await Promise.all([
          fetchProfile(session.user.id),
          fetchSkillsCount(session.user.id)
        ]);
        setProfile(prof);
        setSkillsCount(sc);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          const [prof, sc] = await Promise.all([
            fetchProfile(currentSession.user.id),
            fetchSkillsCount(currentSession.user.id)
          ]);
          setProfile(prof);
          setSkillsCount(sc);
        } else {
          setProfile(null);
          setSkillsCount(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setSkillsCount(null);
      setLoading(false);
    }
  };

  const needsOnboarding = !!(
    profile &&
    profile.role === "student" &&
    (profile.package_lpa === 0 || profile.package_lpa === null || (skillsCount !== null && skillsCount < 12))
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        needsOnboarding,
        skillsCount,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
