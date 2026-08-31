import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe } from "../api/auth";
import {
  setAuthToken,
  setOnAuthExpired,
  resetAuthExpiredFlag,
} from "../api/client";

const AuthContext = createContext(null);

const TOKEN_KEY = "todo_auth_token";
const USER_KEY = "todo_auth_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Register the centralized auth-expired handler once
  useEffect(() => {
    setOnAuthExpired(() => {
      // This is called by client.js when any API call gets 401/403
      setToken(null);
      setUser(null);
      setAuthToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      resetAuthExpiredFlag();
    });
  }, []);

  // Validate stored token on mount; refresh stale user data from /me
  useEffect(() => {
    async function validate() {
      if (!token) {
        setLoading(false);
        return;
      }

      setAuthToken(token);

      try {
        const userData = await getMe(token);
        // Refresh cached user data — /me is always authoritative
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      } catch {
        // Token expired or invalid — clear everything
        setToken(null);
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    }
    validate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveAuth = useCallback((accessToken, userData) => {
    setToken(accessToken);
    setUser(userData);
    setAuthToken(accessToken);
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const value = {
    user,
    token,
    loading,
    saveAuth,
    logout,
    isAuthenticated: !!token && !!user,
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
