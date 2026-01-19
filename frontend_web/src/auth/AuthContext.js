import React, { createContext, useContext, useMemo, useState } from "react";
import { apiClient, clearAuth, getAuthState, setAuthTokens } from "../api/client";

/**
 * @typedef {{ id?: string, email?: string, name?: string }} User
 */

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides authentication state and actions (login/register/logout). */
  const [auth, setAuth] = useState(getAuthState());

  async function login({ email, password }) {
    const data = await apiClient.login({ email, password });
    setAuthTokens({ accessToken: data?.accessToken, refreshToken: data?.refreshToken, user: data?.user });
    setAuth(getAuthState());
    return data;
  }

  async function register({ email, password, name }) {
    const data = await apiClient.register({ email, password, name });
    setAuthTokens({ accessToken: data?.accessToken, refreshToken: data?.refreshToken, user: data?.user });
    setAuth(getAuthState());
    return data;
  }

  function logout() {
    clearAuth();
    setAuth(getAuthState());
  }

  const value = useMemo(
    () => ({
      ...auth,
      login,
      register,
      logout,
      // Expose for debugging in UI
      getAuthState
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth state/actions. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// PUBLIC_INTERFACE
export function requireAuthGuard(isAuthenticated) {
  /** Utility to check if user is authenticated. */
  return !!isAuthenticated;
}
