import { supabase } from "../lib/supabase";

/**
 * Register a new user with email and password.
 * Returns { user, session } from Supabase.
 */
export async function register(email, password) {
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
}

/**
 * Login with email and password.
 * Returns { user, session } from Supabase.
 */
export async function login(email, password) {
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
}

/**
 * Get the current authenticated user.
 * Returns the user object or throws if not authenticated.
 */
export async function getMe() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return user;
}

/**
 * Logout the current user.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout error:", error);
  }
}
