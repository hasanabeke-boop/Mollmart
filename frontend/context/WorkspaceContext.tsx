'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth, type User } from "@/context/AuthContext";
import { apiFetchWithRefresh } from "@/lib/api";
import RecommendationsOnboardingModal from "@/components/onboarding/RecommendationsOnboardingModal";
import {
  defaultActiveMode,
  readStoredActiveMode,
  resolveActiveRole,
  writeStoredActiveMode,
  type WorkspaceMode,
} from "@/lib/workspace";
import { setActiveModeHeaderProvider } from "@/lib/api";

const MODE_FADE_OUT_MS = 280;
const MODE_FADE_IN_MS = 320;

type WorkspaceState = {
  activeMode: WorkspaceMode;
  /** Drives toggle thumb immediately on click */
  visualMode: WorkspaceMode;
  activeRole: User["role"];
  hasDualWorkspace: boolean;
  modeScreenVisible: boolean;
  isModeTransitioning: boolean;
  setActiveMode: (mode: WorkspaceMode) => void;
  enableMixedMode: () => Promise<void>;
  mixedModeBusy: boolean;
};

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading, refreshUser } = useAuth();
  const [activeMode, setActiveModeState] = useState<WorkspaceMode>("buyer");
  const [visualMode, setVisualMode] = useState<WorkspaceMode>("buyer");
  const [modeScreenVisible, setModeScreenVisible] = useState(true);
  const [isModeTransitioning, setIsModeTransitioning] = useState(false);
  const [mixedModeBusy, setMixedModeBusy] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasDualWorkspace = Boolean(user?.hasDualWorkspace);

  const clearFadeTimers = useCallback(() => {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (fadeInTimerRef.current) {
      clearTimeout(fadeInTimerRef.current);
      fadeInTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!user || user.role === "admin") {
      setActiveModeHeaderProvider(null);
      return;
    }
    const stored = readStoredActiveMode();
    const next =
      user.activeWorkspaceMode && user.hasDualWorkspace
        ? user.activeWorkspaceMode
        : stored && user.hasDualWorkspace
          ? stored
        : defaultActiveMode(Boolean(user.canBuy), Boolean(user.canSell));
    setActiveModeState(next);
    setVisualMode(next);
    setModeScreenVisible(true);
    setIsModeTransitioning(false);
    if (user.hasDualWorkspace) {
      writeStoredActiveMode(next);
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role === "admin") {
      setActiveModeHeaderProvider(null);
      return;
    }
    setActiveModeHeaderProvider(() =>
      user.canBuy && user.canSell ? activeMode : null,
    );
    return () => setActiveModeHeaderProvider(null);
  }, [user, activeMode]);

  useEffect(() => {
    if (loading || !user) {
      setOnboardingOpen(false);
      return;
    }
    if (user.role === "admin") {
      setOnboardingOpen(false);
      return;
    }
    setOnboardingOpen(Boolean(user.recommendationsOnboardingPending));
  }, [loading, user]);

  useEffect(() => () => clearFadeTimers(), [clearFadeTimers]);

  const commitMode = useCallback(
    (mode: WorkspaceMode) => {
      setActiveModeState(mode);
      if (hasDualWorkspace) {
        writeStoredActiveMode(mode);
      }
    },
    [hasDualWorkspace],
  );

  const setActiveMode = useCallback(
    (mode: WorkspaceMode) => {
      if (mode === activeMode) return;

      if (hasDualWorkspace) {
        void apiFetchWithRefresh<{ user: User }>("/api/v1/auth/me/active-mode", {
          method: "PATCH",
          service: "auth",
          body: JSON.stringify({ mode }),
        }).catch(() => {
          // The header still carries the active mode for this session; refresh will resync persisted mode.
        });
      }

      if (!hasDualWorkspace) {
        setVisualMode(mode);
        commitMode(mode);
        return;
      }

      if (isModeTransitioning) return;

      clearFadeTimers();
      setVisualMode(mode);
      setIsModeTransitioning(true);
      setModeScreenVisible(false);

      fadeTimerRef.current = setTimeout(() => {
        commitMode(mode);
        fadeInTimerRef.current = setTimeout(() => {
          setModeScreenVisible(true);
          fadeInTimerRef.current = setTimeout(() => {
            setIsModeTransitioning(false);
            fadeInTimerRef.current = null;
          }, MODE_FADE_IN_MS);
        }, 40);
        fadeTimerRef.current = null;
      }, MODE_FADE_OUT_MS);
    },
    [activeMode, hasDualWorkspace, isModeTransitioning, commitMode, clearFadeTimers],
  );

  const enableMixedMode = useCallback(async () => {
    setMixedModeBusy(true);
    try {
      await apiFetchWithRefresh<{ user: User }>("/api/v1/auth/me/enable-mixed-mode", {
        method: "PATCH",
        service: "auth",
      });
      await refreshUser();
      setVisualMode("buyer");
      commitMode("buyer");
      setModeScreenVisible(true);
      setIsModeTransitioning(false);
    } finally {
      setMixedModeBusy(false);
    }
  }, [refreshUser, commitMode]);

  const activeRole = useMemo(() => {
    if (!user) return "buyer" as const;
    return resolveActiveRole(
      user.role,
      Boolean(user.canBuy),
      Boolean(user.canSell),
      activeMode,
    );
  }, [user, activeMode]);

  const value = useMemo(
    () => ({
      activeMode,
      visualMode,
      activeRole,
      hasDualWorkspace,
      modeScreenVisible,
      isModeTransitioning,
      setActiveMode,
      enableMixedMode,
      mixedModeBusy,
    }),
    [
      activeMode,
      visualMode,
      activeRole,
      hasDualWorkspace,
      modeScreenVisible,
      isModeTransitioning,
      setActiveMode,
      enableMixedMode,
      mixedModeBusy,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      {onboardingOpen && user && user.role !== "admin" ? (
        <RecommendationsOnboardingModal
          onDone={async () => {
            setOnboardingOpen(false);
            await refreshUser();
          }}
        />
      ) : null}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}

export function useWorkspaceOptional() {
  return useContext(WorkspaceContext);
}
