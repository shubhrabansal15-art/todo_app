import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

/**
 * AuthProvider wraps the app and manages authentication state.
 *
 * Uses Supabase Auth for:
 * - Session persistence (localStorage via Supabase client)
 * - Token refresh (automatic)
 * - Auth state changes (login, logout, refresh)
 *
 * The user object from Supabase Auth has:
 * - id (UUID)
 * - email
 * - created_at
 * - app_metadata
 * - user_metadata
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Register a new user.
   * Returns the auth response from Supabase.
   */
  const register = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new Error("An account with this email already exists");
      }
      throw new Error(error.message || "Registration failed");
    }

    return {
      user: data.user,
      session: data.session,
    };
  }, []);

  /**
   * Login with email and password.
   * Returns the auth response from Supabase.
   */
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login")) {
        throw new Error("Invalid email or password");
      }
      throw new Error(error.message || "Login failed");
    }

    return {
      user: data.user,
      session: data.session,
    };
  }, []);

  /**
   * Logout the current user.
   */
  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
    }
    // Auth state change listener will set user to null
  }, []);

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
