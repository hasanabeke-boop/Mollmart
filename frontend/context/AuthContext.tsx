'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  apiFetch,
  apiFetchWithRefresh,
  refreshAccessToken,
  setAccessToken,
  type ApiError,
} from "@/lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "buyer" | "seller" | "admin";
  status: "active" | "blocked" | "suspended";
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    username: string,
    email: string,
    password: string,
    role: "buyer" | "seller",
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const data = await apiFetchWithRefresh<{
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
      }>("/api/v1/auth/me", { service: "auth" });
      setUser({
        id: data.id,
        name: data.name || "",
        email: data.email || "",
        role: (data.role as User["role"]) || "buyer",
        status: (data.status as User["status"]) || "active",
      });
    } catch {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await refreshAccessToken();
    if (token) {
      await fetchMe();
    } else {
      setUser(null);
    }
  }, [fetchMe]);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ accessToken: string }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        service: "auth",
        body: JSON.stringify({ email, password }),
      },
    );
    setAccessToken(data.accessToken);
    try {
      const me = await apiFetch<{
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
      }>("/api/v1/auth/me", { service: "auth" });
      setUser({
        id: me.id,
        name: me.name || "",
        email: me.email || "",
        role: (me.role as User["role"]) || "buyer",
        status: (me.status as User["status"]) || "active",
      });
    } catch {
      setUser({ id: "", name: "", email, role: "buyer", status: "active" });
    }
  }, []);

  const signup = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      role: "buyer" | "seller",
    ) => {
      await apiFetch<{ message: string }>("/api/v1/auth/signup", {
        method: "POST",
        service: "auth",
        body: JSON.stringify({ username, email, password, role }),
      });
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST", service: "auth" });
    } catch {
      // ignore
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser }),
    [user, loading, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type { ApiError };
