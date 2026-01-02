import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Role } from "../types/auth-types";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
} from "../utils/authStorage";
import { getMe, loginWithPassword, refreshSession } from "../services/auth.service";

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  role?: Role;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      setIsLoading(true);
      if (!getAccessToken() && getRefreshToken()) {
        await refreshSession();
      }
      if (getAccessToken()) {
        try {
          const me = await getMe();
          if (!isMounted) return;
          setRole(me.role);
          setIsAuthenticated(true);
        } catch {
          clearAuthTokens();
          if (!isMounted) return;
          setIsAuthenticated(false);
          setRole(undefined);
        }
      } else {
        setIsAuthenticated(false);
        setRole(undefined);
      }
      if (!isMounted) return;
      setIsLoading(false);
    };
    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, senha: string) => {
    const res = await loginWithPassword(email, senha);
    if (res.role) {
      setRole(res.role);
      setIsAuthenticated(true);
      return;
    }
    const me = await getMe();
    setRole(me.role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearAuthTokens();
    setIsAuthenticated(false);
    setRole(undefined);
    window.location.assign("/login");
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      role,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
