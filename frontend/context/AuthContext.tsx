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
import { useRouter } from "next/navigation";
import {
  apiFetch,
  apiFetchWithRefresh,
  getAccessToken,
  refreshAccessToken,
  setAccessToken,
  type ApiError,
} from "@/lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified?: string | boolean | null;
  role: "buyer" | "seller" | "admin";
  status: "active" | "blocked" | "suspended";
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (
    username: string,
    email: string,
    password: string,
    role: "buyer" | "seller",
  ) => Promise<{
    message: string;
    requiresEmailVerification?: boolean;
    verificationToken?: string;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

type MeResponse =
  | User
  | {
      user: User;
    };

function unwrapUser(data: MeResponse): User {
  return "user" in data ? data.user : data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const data = await apiFetchWithRefresh<MeResponse>("/api/v1/auth/me", { service: "auth" });
      const me = unwrapUser(data);
      setUser({
        id: me.id,
        name: me.name || "",
        email: me.email || "",
        emailVerified: me.emailVerified ?? null,
        role: (me.role as User["role"]) || "buyer",
        status: (me.status as User["status"]) || "active",
      });
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await refreshAccessToken();
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    await fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await apiFetch<{ accessToken: string }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        service: "auth",
        body: JSON.stringify({ email, password }),
      },
    );
    setAccessToken(data.accessToken);
    let nextUser: User;
    try {
      const meRes = await apiFetch<MeResponse>("/api/v1/auth/me", { service: "auth" });
      const me = unwrapUser(meRes);
      nextUser = {
        id: me.id,
        name: me.name || "",
        email: me.email || "",
        emailVerified: me.emailVerified ?? null,
        role: (me.role as User["role"]) || "buyer",
        status: (me.status as User["status"]) || "active",
      };
    } catch {
      nextUser = { id: "", name: "", email, role: "buyer", status: "active" };
    }
    setUser(nextUser);
    return nextUser;
  }, []);

  const signup = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      role: "buyer" | "seller",
    ) => {
      return await apiFetch<{
        message: string;
        requiresEmailVerification?: boolean;
        verificationToken?: string;
      }>("/api/v1/auth/signup", {
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
    router.replace("/");
  }, [router]);

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
