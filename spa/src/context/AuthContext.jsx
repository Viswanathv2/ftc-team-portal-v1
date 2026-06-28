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

  const avatarUrl = await loadAvatar(user.email);

  if (error || !data) {
    return {
      displayName: safeNameFromEmail(user.email),
      isCoach: false,
      isPortalAdmin: false,
      avatarUrl
    };
  }

  return {
    displayName: data.display_name || safeNameFromEmail(user.email),
    isCoach: Boolean(data.is_coach),
    isPortalAdmin: Boolean(data.is_portal_admin),
    avatarUrl
  };
}

// Find a profile photo for the logged-in user by matching their email
// against the team_members / coaches / mentors rosters.
async function loadAvatar(email) {
  const target = String(email || "").trim().toLowerCase();
  if (!target) return "";
  for (const table of ["team_members", "coaches", "mentors"]) {
    const { data } = await supabase
      .from(table)
      .select("image_url,email")
      .ilike("email", target)
      .limit(1)
      .maybeSingle();
    if (data?.image_url) {
      return data.image_url;
    }
  }
  return "";
}

const EMPTY_PROFILE = { displayName: "Member", isCoach: false, isPortalAdmin: false, avatarUrl: "" };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restore() {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user || null;
      if (!active) return;

      if (!sessionUser) {
        setUser(null);
        setProfile(EMPTY_PROFILE);
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
        setProfile(EMPTY_PROFILE);
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
      setProfile(EMPTY_PROFILE);
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
