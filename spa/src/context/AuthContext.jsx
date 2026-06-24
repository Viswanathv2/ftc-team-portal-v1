import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

function safeNameFromEmail(email) {
  return String(email || "Member").split("@")[0] || "Member";
}

async function loadProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name,is_coach,is_portal_admin")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return {
      displayName: safeNameFromEmail(user.email),
      isCoach: false,
      isPortalAdmin: false
    };
  }

  return {
    displayName: data.display_name || safeNameFromEmail(user.email),
    isCoach: Boolean(data.is_coach),
    isPortalAdmin: Boolean(data.is_portal_admin)
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ displayName: "Member", isCoach: false, isPortalAdmin: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restore() {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user || null;
      if (!active) return;

      if (!sessionUser) {
        setUser(null);
        setProfile({ displayName: "Member", isCoach: false, isPortalAdmin: false });
        setLoading(false);
        return;
      }

      const nextProfile = await loadProfile(sessionUser);
      if (!active) return;
      setUser(sessionUser);
      setProfile(nextProfile);
      setLoading(false);
    }

    restore();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user || null;
      if (!active) return;

      if (!sessionUser) {
        setUser(null);
        setProfile({ displayName: "Member", isCoach: false, isPortalAdmin: false });
        return;
      }

      const nextProfile = await loadProfile(sessionUser);
      if (!active) return;
      setUser(sessionUser);
      setProfile(nextProfile);
    });

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    async register(email, password, displayName) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Registration failed. Try again.");
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: data.user.id,
        display_name: displayName,
        is_coach: false,
        is_portal_admin: false
      });

      if (profileError) {
        throw profileError;
      }
    },
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      if (!data.user) {
        throw new Error("Login failed. Check your credentials.");
      }
      const nextProfile = await loadProfile(data.user);
      setUser(data.user);
      setProfile(nextProfile);
      return data.user;
    },
    async logout() {
      await supabase.auth.signOut();
      setUser(null);
      setProfile({ displayName: "Member", isCoach: false, isPortalAdmin: false });
    }
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
