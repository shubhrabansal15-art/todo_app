import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe } from "../api/auth";

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

  // Validate stored token on mount
  useEffect(() => {
    async function validate() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await getMe(token);
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      } catch {
        // Token expired or invalid
        logout();
      } finally {
        setLoading(false);
      }
    }
    validate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveAuth = useCallback((accessToken, userData) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
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
