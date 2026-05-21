'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import WorkspaceModeToggle from "@/components/nav/WorkspaceModeToggle";
import { useToast } from "@/context/ToastContext";
import { apiFetch, apiFetchWithRefresh } from "@/lib/api";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/currency";
import { demoWithdrawWallet, fetchWalletMe } from "@/lib/requestDeals";
import EditProfileModal, { type ProfileMeResponse } from "@/components/profile/EditProfileModal";

type ProfileStats = {
  primary: number;
  secondary: number;
  conversations: number;
};

function roleLabel(role: string | undefined) {
  if (role === "seller") return "Seller";
  if (role === "admin") return "Admin";
  return "Buyer";
}

function readRecommendedCategoryIds(prefs: unknown): string[] {
  if (prefs == null || typeof prefs !== "object") return [];
  const raw = (prefs as { recommendedCategoryIds?: unknown }).recommendedCategoryIds;
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x)).filter((s) => s.length > 0);
}

type ProfileMainTab = "overview" | "preferences" | "balance";

type NotificationPreferences = {
  requestUpdates: boolean;
  offerReplies: boolean;
  newsletter: boolean;
};

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  requestUpdates: true,
  offerReplies: true,
  newsletter: false,
};

function navButtonClass(active: boolean) {
  return `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
    active ? "bg-primary/10 font-medium text-[#0d1b12]" : "text-[#0d1b12] hover:bg-[#f5f6f8]"
  }`;
}

export default function UserProfilePage() {
  const { user, loading: authLoading, refreshUser, logout } = useAuth();
  const { activeRole, hasDualWorkspace, enableMixedMode, mixedModeBusy } = useWorkspace();
  const { success: toastSuccess, error: toastError } = useToast();
  const router = useRouter();

  const canEnableMixedMode =
    Boolean(user) &&
    user?.role !== "admin" &&
    !hasDualWorkspace &&
    Boolean(
      (user?.canBuy && !user?.canSell) || (!user?.canBuy && user?.canSell),
    );

  const [profileData, setProfileData] = useState<ProfileMeResponse | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [mainTab, setMainTab] = useState<ProfileMainTab>("overview");
  const [prefCategoryIds, setPrefCategoryIds] = useState<string[]>([]);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState("");

  const [stats, setStats] = useState<ProfileStats>({ primary: 0, secondary: 0, conversations: 0 });
  const [catalogCategories, setCatalogCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletWithdraw, setWalletWithdraw] = useState("");
  const [walletWithdrawCardName, setWalletWithdrawCardName] = useState("");
  const [walletWithdrawCardLast4, setWalletWithdrawCardLast4] = useState("");
  const [walletBusy, setWalletBusy] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [notifPrefsSaving, setNotifPrefsSaving] = useState(false);
  const [notifPrefsLoaded, setNotifPrefsLoaded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await apiFetch<Array<{ id: string; name: string; slug: string }>>("/api/v1/catalog/categories", {
          service: "catalog",
        });
        if (!cancelled && Array.isArray(rows)) setCatalogCategories(rows);
      } catch {
        if (!cancelled) setCatalogCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const applyProfileToDisplay = useCallback(
    (data: ProfileMeResponse, u: typeof user) => {
      const fromApi = (data.fullName ?? "").trim();
      const looksLikePlaceholderId = u != null && fromApi === u.id;
      let name = fromApi;
      if (looksLikePlaceholderId || !name) {
        name = u?.name?.trim() || u?.email?.split("@")[0] || "User";
      }
      setDisplayName(name);
      setLocation((data.city ?? "").trim());
      setPhoneDisplay((data.phone ?? "").trim());
    },
    [],
  );

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiFetchWithRefresh<ProfileMeResponse>("/api/v1/profiles/me", {
        service: "profile",
      });
      setProfileData(data);
      applyProfileToDisplay(data, user);
    } catch {
      setProfileData(null);
      setDisplayName(user.name || user.email?.split("@")[0] || "User");
      setLocation("");
      setPhoneDisplay("");
      toastError("Could not load profile.");
    }
  }, [user, applyProfileToDisplay, toastError]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user, loadProfile]);

  const loadNotificationPreferences = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiFetchWithRefresh<{ preferences: NotificationPreferences }>(
        "/api/v1/notifications/preferences",
        { service: "notification" },
      );
      setNotifPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...data.preferences });
    } catch {
      setNotifPrefs(DEFAULT_NOTIFICATION_PREFERENCES);
    } finally {
      setNotifPrefsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (user) void loadNotificationPreferences();
  }, [user, loadNotificationPreferences]);

  const saveNotificationPreferences = useCallback(
    async (next: NotificationPreferences) => {
      setNotifPrefs(next);
      setNotifPrefsSaving(true);
      try {
        const data = await apiFetchWithRefresh<{ preferences: NotificationPreferences }>(
          "/api/v1/notifications/preferences",
          {
            method: "PATCH",
            service: "notification",
            body: JSON.stringify(next),
          },
        );
        setNotifPrefs(data.preferences);
        toastSuccess("Notification settings saved.");
      } catch (e: unknown) {
        setNotifPrefs(notifPrefs);
        toastError(e instanceof Error ? e.message : "Could not save notification settings.");
        void loadNotificationPreferences();
      } finally {
        setNotifPrefsSaving(false);
      }
    },
    [notifPrefs, loadNotificationPreferences, toastSuccess, toastError],
  );

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const conversations = await apiFetchWithRefresh<{ items?: unknown[]; data?: unknown[] }>(
        "/api/v1/conversations?limit=100",
        { service: "chat" },
      );
      const conversationCount = conversations.items?.length || conversations.data?.length || 0;

      if (activeRole === "seller") {
        const offers = await apiFetchWithRefresh<{ items?: Array<{ status: string }>; data?: Array<{ status: string }> }>(
          "/api/v1/offers/me?limit=100",
          { service: "offer" },
        );
        const items = offers.items || offers.data || [];
        setStats({
          primary: items.length,
          secondary: items.filter((offer) => offer.status === "accepted").length,
          conversations: conversationCount,
        });
      } else {
        const requests = await apiFetchWithRefresh<{ items?: Array<{ offerCount?: number }>; data?: Array<{ offerCount?: number }> }>(
          "/api/v1/requests/me?limit=100",
          { service: "request" },
        );
        const items = requests.items || requests.data || [];
        setStats({
          primary: items.length,
          secondary: items.reduce((sum, request) => sum + (request.offerCount || 0), 0),
          conversations: conversationCount,
        });
      }
    } catch {
      setStats({ primary: 0, secondary: 0, conversations: 0 });
    }
  }, [user, activeRole]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const loadWallet = useCallback(async () => {
    if (!user || activeRole !== "seller") return;
    try {
      const w = await fetchWalletMe();
      setWalletBalance(typeof w.balance === "number" ? w.balance : 0);
    } catch {
      setWalletBalance(0);
    }
  }, [user, activeRole]);

  useEffect(() => {
    if (mainTab === "balance" && activeRole === "seller") {
      void loadWallet();
    }
  }, [mainTab, activeRole, loadWallet]);

  const handleSaved = useCallback(async () => {
    await loadProfile();
    await refreshUser();
    toastSuccess("Profile updated.");
  }, [loadProfile, refreshUser, toastSuccess]);

  const prefsMode = useMemo<"buyer" | "seller" | null>(() => {
    if (!profileData || !user) return null;
    if (user.role === "admin") {
      if (profileData.sellerProfile) return "seller";
      if (profileData.buyerProfile) return "buyer";
      return null;
    }
    if (hasDualWorkspace) {
      if (activeRole === "seller" && profileData.sellerProfile) return "seller";
      if (activeRole === "buyer" && profileData.buyerProfile) return "buyer";
      return activeRole === "seller" ? "seller" : "buyer";
    }
    if (user.canSell && profileData.sellerProfile) return "seller";
    if (user.canBuy && profileData.buyerProfile) return "buyer";
    return null;
  }, [user, profileData, hasDualWorkspace, activeRole]);

  const preferenceLabels = useMemo(() => {
    if (!profileData || prefsMode == null) return [];
    const prefs =
      prefsMode === "seller"
        ? profileData.sellerProfile?.preferencesJson
        : profileData.buyerProfile?.preferencesJson;
    const ids = readRecommendedCategoryIds(prefs);
    return ids
      .map((id) => catalogCategories.find((c) => c.id === id)?.name)
      .filter((x): x is string => Boolean(x));
  }, [profileData, prefsMode, catalogCategories]);

  useEffect(() => {
    if (mainTab !== "preferences" || prefsMode == null || !profileData) return;
    const prefs =
      prefsMode === "seller"
        ? profileData.sellerProfile?.preferencesJson
        : profileData.buyerProfile?.preferencesJson;
    setPrefCategoryIds(readRecommendedCategoryIds(prefs));
  }, [mainTab, prefsMode, profileData]);

  const togglePrefCategory = (id: string) => {
    setPrefCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveRecommendationPreferences = async () => {
    if (!profileData || prefsMode == null) return;
    setPrefError("");
    setPrefSaving(true);
    try {
      const prevRaw =
        prefsMode === "seller"
          ? profileData.sellerProfile?.preferencesJson
          : profileData.buyerProfile?.preferencesJson;
      const prevPrefs =
        prevRaw != null && typeof prevRaw === "object" ? (prevRaw as Record<string, unknown>) : {};
      const body = {
        preferencesJson: {
          ...prevPrefs,
          recommendedCategoryIds: prefCategoryIds,
        },
      };
      if (prefsMode === "seller") {
        await apiFetchWithRefresh("/api/v1/profiles/me/seller", {
          method: "PATCH",
          service: "profile",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetchWithRefresh("/api/v1/profiles/me/buyer", {
          method: "PATCH",
          service: "profile",
          body: JSON.stringify(body),
        });
      }
      await loadProfile();
      toastSuccess("Preferences saved.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not save preferences.";
      setPrefError(msg);
      toastError(msg);
    } finally {
      setPrefSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (deletePassword.trim().length < 6) {
      toastError("Enter your current password.");
      return;
    }

    setDeleteBusy(true);
    try {
      await apiFetchWithRefresh("/api/v1/auth/me", {
        method: "DELETE",
        service: "auth",
        body: JSON.stringify({ currentPassword: deletePassword }),
      });
      toastSuccess("Account deleted.");
      await logout();
    } catch (e: unknown) {
      toastError(e instanceof Error ? e.message : "Could not delete account.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 px-4 md:px-10 py-8 min-h-[calc(100vh-80px)]">
      {user && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          user={user}
          profile={profileData}
          onSaved={handleSaved}
        />
      )}

      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
        <nav className="flex flex-col gap-1 bg-white p-2 rounded-xl border border-[#e7f3eb] shadow-sm">
          <button
            type="button"
            onClick={() => setMainTab("overview")}
            className={navButtonClass(mainTab === "overview")}
          >
            <span className="material-symbols-outlined">person</span>
            Profile
          </button>
          {activeRole !== "seller" && user?.role !== "admin" && (
            <Link
              href="/my-requests"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f5f6f8] text-sm transition-colors text-[#0d1b12]"
            >
              <span className="material-symbols-outlined">playlist_add</span>
              My Requests
            </Link>
          )}
          {activeRole === "seller" && (
            <>
              <Link
                href="/seller/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f5f6f8] text-sm transition-colors text-[#0d1b12]"
              >
                <span className="material-symbols-outlined">dashboard</span>
                Seller Dashboard
              </Link>
              <Link
                href="/browse-buyer-requests"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f5f6f8] text-sm transition-colors text-[#0d1b12]"
              >
                <span className="material-symbols-outlined">travel_explore</span>
                Buyer Requests
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMainTab("preferences")}
            className={navButtonClass(mainTab === "preferences")}
          >
            <span className="material-symbols-outlined">tune</span>
            Preferences
          </button>
          {activeRole === "seller" && (
            <button
              type="button"
              onClick={() => setMainTab("balance")}
              className={navButtonClass(mainTab === "balance")}
            >
              <span className="material-symbols-outlined">account_balance_wallet</span>
              Balance
            </button>
          )}
        </nav>

        <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-[#102216] to-[#1a2e22] text-white">
          <div className="relative z-10 flex flex-col gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">
              {activeRole === "seller" ? "travel_explore" : "playlist_add"}
            </span>
            <h4 className="font-bold text-lg">
              {activeRole === "seller" ? "Find buyer demand" : "Post buyer demand"}
            </h4>
            <p className="text-xs text-gray-300 mb-2">
              {activeRole === "seller"
                ? "Respond to live buyer requests and start more conversations."
                : "Create a request so sellers can respond with offers."}
            </p>
            <Link
              href={activeRole === "seller" ? "/browse-buyer-requests" : "/create-product-request"}
              className="w-full py-2 bg-primary text-[#0d1b12] text-xs font-bold rounded-lg hover:bg-green-400 transition-colors text-center"
            >
              {activeRole === "seller" ? "Browse Requests" : "Post Request"}
            </Link>
          </div>
          <div className="absolute -bottom-8 -right-8 size-24 bg-primary/20 rounded-full blur-xl" />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col gap-8 min-w-0">
        <section className="bg-white rounded-2xl p-6 border border-[#e7f3eb] shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="size-24 md:size-28 rounded-full border-4 border-[#f5f6f8] shadow-sm flex items-center justify-center bg-[#e7f3eb] text-2xl font-bold text-[#4c9a66]">
                  {(displayName.trim().charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}
                </div>
                <div
                  className="absolute bottom-1 right-1 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-500 text-white shadow-sm"
                  aria-hidden
                >
                  <span className="material-symbols-outlined block text-[17px] leading-none text-white">
                    verified
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#4c9a66] mb-1">
                  {mainTab === "preferences"
                    ? "Preferences"
                    : mainTab === "balance"
                      ? "Balance"
                      : "Overview"}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold mb-1 text-[#0d1b12]">
                  {displayName || "—"}
                </h1>
                {user?.email && (
                  <p className="text-sm text-gray-500 mb-2">{user.email}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#4c9a66]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">
                      verified_user
                    </span>
                    {hasDualWorkspace ? "Buyer & seller" : roleLabel(activeRole)} account
                  </span>
                  {location ? (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">
                        location_on
                      </span>
                      {location}
                    </span>
                  ) : null}
                  {phoneDisplay ? (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">call</span>
                      {phoneDisplay}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:items-end">
              {hasDualWorkspace ? <WorkspaceModeToggle /> : null}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                disabled={!profileData}
                className="w-full md:w-auto px-5 py-2.5 rounded-lg bg-primary text-black text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0fd650] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit profile
              </button>
            </div>
          </div>
        </section>

        {mainTab === "overview" ? (
          <>
            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-[#e7f3eb] shadow-sm flex flex-col gap-1">
                <p className="text-sm text-[#4c9a66] font-medium">{activeRole === "seller" ? "Offers Sent" : "My Requests"}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#0d1b12]">{stats.primary}</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-[#e7f3eb] shadow-sm flex flex-col gap-1">
                <p className="text-sm text-[#4c9a66] font-medium">{activeRole === "seller" ? "Accepted Offers" : "Offers Received"}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#0d1b12]">{stats.secondary}</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-[#e7f3eb] shadow-sm flex flex-col gap-1">
                <p className="text-sm text-[#4c9a66] font-medium">Conversations</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#0d1b12]">{stats.conversations}</span>
                </div>
              </div>
            </section>

            {canEnableMixedMode ? (
              <section className="rounded-xl border border-[#e7f3eb] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold text-[#0d1b12]">Buy and sell on one account</h3>
                    <p className="mt-1 text-sm text-[#4c9a66]">
                      Enable mixed mode to post buyer requests and respond as a seller. Use the navbar toggle to switch
                      workspaces anytime.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={mixedModeBusy}
                    onClick={async () => {
                      try {
                        await enableMixedMode();
                        toastSuccess("Mixed mode enabled. Use Buyer | Seller in the header to switch.");
                      } catch (e: unknown) {
                        toastError(e instanceof Error ? e.message : "Could not enable mixed mode.");
                      }
                    }}
                    className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-black hover:bg-[#0fd650] disabled:opacity-50"
                  >
                    {mixedModeBusy ? "Enabling…" : "Enable mixed mode"}
                  </button>
                </div>
              </section>
            ) : null}

            {/* Interests & Notifications */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-[#e7f3eb] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">interests</span>
                    <h3 className="font-bold">Interests</h3>
                  </div>
                </div>
                <p className="text-sm text-[#4c9a66] mb-4">
                  Categories you use for personalized recommendations. Your buyer requests or published showcase
                  listings still help when nothing is selected here.
                </p>
                <div className="flex flex-wrap gap-2">
                  {preferenceLabels.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      None selected yet. Open the <span className="font-semibold">Preferences</span> tab in the sidebar to pick categories.
                    </p>
                  ) : (
                    preferenceLabels.map((name) => (
                      <span
                        key={name}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border bg-[#f5f6f8] border-[#e7f3eb] text-[#4c9a66]"
                      >
                        {name}
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-primary">
                  <button
                    type="button"
                    onClick={() => setMainTab("preferences")}
                    className="hover:underline text-left"
                  >
                    Edit in Preferences
                  </button>
                  {activeRole === "seller" ? (
                    <Link href="/browse-buyer-requests" className="hover:underline">
                      Browse buyer requests
                    </Link>
                  ) : (
                    <Link href="/products" className="hover:underline">
                      Browse showcase
                    </Link>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-[#e7f3eb] shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">notifications</span>
                  <h3 className="font-bold">Notifications</h3>
                </div>
                <div className="flex flex-col gap-4">
                  <ToggleRow
                    label="Request updates"
                    description="New requests, offers, and request-deal orders"
                    checked={notifPrefs.requestUpdates}
                    disabled={!notifPrefsLoaded || notifPrefsSaving}
                    onChange={(checked) =>
                      void saveNotificationPreferences({ ...notifPrefs, requestUpdates: checked })
                    }
                  />
                  <ToggleRow
                    label="Offer replies"
                    description="Offers, acceptances, and chat messages"
                    checked={notifPrefs.offerReplies}
                    disabled={!notifPrefsLoaded || notifPrefsSaving}
                    onChange={(checked) =>
                      void saveNotificationPreferences({ ...notifPrefs, offerReplies: checked })
                    }
                  />
                  <ToggleRow
                    label="Email copies"
                    description="Also send notifications to your email"
                    checked={notifPrefs.newsletter}
                    disabled={!notifPrefsLoaded || notifPrefsSaving}
                    onChange={(checked) =>
                      void saveNotificationPreferences({ ...notifPrefs, newsletter: checked })
                    }
                  />
                  <p className="text-xs text-[#4c9a66]">
                    {notifPrefsSaving
                      ? "Saving…"
                      : "Account alerts (e.g. blocked account) are always delivered in the app."}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-red-800">Delete account</h3>
                  <p className="mt-1 text-sm text-red-600">
                    Permanently remove your account, profile, requests, offers, chats, products, and sessions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeletePassword("");
                    setDeleteOpen(true);
                  }}
                  className="shrink-0 rounded-lg border border-red-200 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
                >
                  Delete account
                </button>
              </div>
            </section>
          </>
        ) : mainTab === "preferences" ? (
          <section className="bg-white rounded-2xl border border-[#e7f3eb] shadow-sm p-6 md:p-8">
            <h2 className="text-lg font-bold text-[#0d1b12] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">category</span>
              Recommendation categories
            </h2>
            {prefsMode == null ? (
              <p className="text-sm text-slate-600 max-w-lg">
                Recommendation categories are available once your account has a buyer or seller profile. If you think this is a mistake, try refreshing the page or contact support.
              </p>
            ) : (
              <>
                <p className="text-sm text-[#4c9a66] mb-6 max-w-2xl">
                  {prefsMode === "buyer"
                    ? "Pick categories you care about. They power the Recommendations view on the showcase page. If you clear everything, we still infer categories from your buyer requests when possible."
                    : "Pick categories you want to sell in. They power the Recommendations tab when you browse buyer requests. If you clear everything, we still use categories from your published showcase listings when possible."}
                </p>
                {prefError ? (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {prefError}
                  </div>
                ) : null}
                <div className="max-h-80 overflow-y-auto flex flex-wrap gap-2 rounded-xl border border-[#e7f3eb] bg-[#f5f6f8] p-3">
                  {catalogCategories.length === 0 ? (
                    <span className="text-sm text-slate-500">Categories could not be loaded.</span>
                  ) : (
                    catalogCategories.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded-full border border-[#e7f3eb] bg-white px-3 py-1.5 text-sm font-medium text-[#0d1b12]"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-[#e7f3eb] text-primary focus:ring-primary"
                          checked={prefCategoryIds.includes(c.id)}
                          onChange={() => togglePrefCategory(c.id)}
                        />
                        {c.name}
                      </label>
                    ))
                  )}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={prefSaving || prefsMode == null}
                    onClick={() => void saveRecommendationPreferences()}
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-black hover:bg-[#0fd650] disabled:opacity-50"
                  >
                    {prefSaving ? "Saving…" : "Save preferences"}
                  </button>
                  <Link
                    href={prefsMode === "seller" ? "/browse-buyer-requests" : "/products"}
                    className="text-sm font-bold text-[#4c9a66] hover:underline"
                  >
                    {prefsMode === "seller" ? "Open buyer requests" : "Open showcase"}
                  </Link>
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-[#e7f3eb] shadow-sm p-6 md:p-8">
            <h2 className="text-lg font-bold text-[#0d1b12] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              Seller balance
            </h2>
            <p className="text-sm text-[#4c9a66] mb-6">
              Funds from completed request deals (demo payments). Withdrawal is simulated with payout card details;
              no real transfer is made.
            </p>
            {activeRole !== "seller" ? (
              <p className="text-sm text-slate-600">
                Switch to seller mode in the header to view your balance.
              </p>
            ) : (
              <>
                <div className="rounded-xl border border-[#e7f3eb] bg-[#f5f6f8] p-6 mb-6">
                  <p className="text-xs font-semibold uppercase text-[#4c9a66]">Available</p>
                  <p className="text-3xl font-black text-[#0d1b12]">
                    {walletBalance == null ? "…" : formatMoney(walletBalance, DEFAULT_CURRENCY)}
                  </p>
                </div>
                <div className="max-w-md space-y-4">
                  <p className="text-xs font-semibold uppercase text-[#4c9a66]">Payout card (demo)</p>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4c9a66]">Name on card</label>
                    <input
                      value={walletWithdrawCardName}
                      onChange={(e) => setWalletWithdrawCardName(e.target.value)}
                      className="w-full rounded-lg border border-[#e7f3eb] px-3 py-2 text-sm"
                      placeholder="Seller name"
                      autoComplete="cc-name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4c9a66]">Last 4 digits</label>
                    <input
                      value={walletWithdrawCardLast4}
                      onChange={(e) => setWalletWithdrawCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full rounded-lg border border-[#e7f3eb] px-3 py-2 text-sm tracking-widest"
                      placeholder="4242"
                      inputMode="numeric"
                      autoComplete="cc-number"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4c9a66]">
                      Amount ({DEFAULT_CURRENCY})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={`Amount (${DEFAULT_CURRENCY})`}
                      value={walletWithdraw}
                      onChange={(e) => setWalletWithdraw(e.target.value)}
                      className="w-full rounded-lg border border-[#e7f3eb] px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={
                      walletBusy ||
                      walletWithdrawCardLast4.length !== 4 ||
                      !walletWithdrawCardName.trim() ||
                      !Number.isFinite(Number(walletWithdraw)) ||
                      Number(walletWithdraw) <= 0
                    }
                    onClick={async () => {
                      const n = Number(walletWithdraw);
                      if (!Number.isFinite(n) || n <= 0) {
                        toastError("Enter a valid amount.");
                        return;
                      }
                      if (walletWithdrawCardLast4.length !== 4) {
                        toastError("Enter the last 4 digits of the card.");
                        return;
                      }
                      if (!walletWithdrawCardName.trim()) {
                        toastError("Enter the name on the card.");
                        return;
                      }
                      setWalletBusy(true);
                      try {
                        const r = await demoWithdrawWallet(n, {
                          cardLast4: walletWithdrawCardLast4,
                          cardHolderName: walletWithdrawCardName.trim(),
                        });
                        setWalletBalance(r.balance);
                        setWalletWithdraw("");
                        setWalletWithdrawCardName("");
                        setWalletWithdrawCardLast4("");
                        toastSuccess(`Demo withdraw: ${formatMoney(r.withdrawn, DEFAULT_CURRENCY)}`);
                      } catch (e: unknown) {
                        toastError(e instanceof Error ? e.message : "Withdraw failed.");
                      } finally {
                        setWalletBusy(false);
                      }
                    }}
                    className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-black hover:bg-[#0fd650] disabled:opacity-50 sm:w-auto"
                  >
                    {walletBusy ? "…" : "Demo withdraw"}
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setDeleteOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-[#0d1b12]">Delete account</h3>
              <button type="button" onClick={() => setDeleteOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                This cannot be undone. Enter your current password to confirm deletion.
              </div>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Current password</span>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full rounded-lg border border-[#e7f3eb] px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  autoComplete="current-password"
                  autoFocus
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void deleteAccount()}
                  disabled={deleteBusy || deletePassword.trim().length < 6}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteBusy ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type ToggleRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#0d1b12]">{label}</p>
        {description ? <p className="text-xs text-[#4c9a66]">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50 ${
          checked ? "bg-primary border-primary" : "bg-[#f5f6f8] border-[#e7f3eb]"
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

