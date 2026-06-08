'use client';

import { useCallback, useEffect, useState } from "react";
import type { User } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiFetchWithRefresh } from "@/lib/api";
import { uploadProfileAvatar } from "@/lib/profile";
import { canEditBuyerProfile, canEditSellerProfile } from "@/lib/workspace";

export type ProfileMeResponse = {
  userId: string;
  role: string;
  fullName: string;
  phone?: string | null;
  city?: string | null;
  avatarUrl?: string | null;
  sellerProfile: {
    displayName: string;
    description: string | null;
    businessType: string | null;
    website: string | null;
    instagramUrl: string | null;
    preferencesJson?: unknown;
    verificationStatus: string;
    ratingAverage: number;
    completedDealsCount: number;
  } | null;
  buyerProfile: {
    displayName: string;
    city: string | null;
    preferencesJson?: unknown;
  } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  user: User;
  profile: ProfileMeResponse | null;
  onSaved: () => void;
};

function emptyToUndefined(s: string): string | undefined {
  const t = s.trim();
  return t.length > 0 ? t : undefined;
}

export default function EditProfileModal({ open, onClose, user, profile, onSaved }: Props) {
  const { error: toastError, info: toastInfo } = useToast();
  const showSellerSection = canEditSellerProfile(user) && Boolean(profile?.sellerProfile);
  const showBuyerSection = canEditBuyerProfile(user) && Boolean(profile?.buyerProfile);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [sellerDisplayName, setSellerDisplayName] = useState("");
  const [sellerDescription, setSellerDescription] = useState("");
  const [sellerBusinessType, setSellerBusinessType] = useState("");
  const [sellerWebsite, setSellerWebsite] = useState("");
  const [sellerInstagramUrl, setSellerInstagramUrl] = useState("");

  const [buyerDisplayName, setBuyerDisplayName] = useState("");
  const [buyerCity, setBuyerCity] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");

  const resetFromProfile = useCallback(() => {
    if (!profile) return;
    const looksLikeId = profile.fullName === profile.userId;
    const displayName =
      looksLikeId && user.name?.trim()
        ? user.name.trim()
        : (profile.fullName ?? "").trim();
    setFullName(displayName);
    setPhone(profile.phone ?? "");
    setCity(profile.city ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");

    if (profile.sellerProfile) {
      const sd =
        profile.sellerProfile.displayName === profile.userId && user.name?.trim()
          ? user.name.trim()
          : profile.sellerProfile.displayName;
      setSellerDisplayName(sd);
      setSellerDescription(profile.sellerProfile.description ?? "");
      setSellerBusinessType(profile.sellerProfile.businessType ?? "");
      setSellerWebsite(profile.sellerProfile.website ?? "");
      setSellerInstagramUrl(profile.sellerProfile.instagramUrl ?? "");
    } else {
      setSellerDisplayName("");
      setSellerDescription("");
      setSellerBusinessType("");
      setSellerWebsite("");
      setSellerInstagramUrl("");
    }

    if (profile.buyerProfile) {
      const bd =
        profile.buyerProfile.displayName === profile.userId && user.name?.trim()
          ? user.name.trim()
          : profile.buyerProfile.displayName;
      setBuyerDisplayName(bd);
      setBuyerCity(profile.buyerProfile.city ?? "");
    } else {
      setBuyerDisplayName("");
      setBuyerCity("");
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setUploadingAvatar(false);
    setError("");
  }, [profile, user.name]);

  const handleAvatarUpload = async (file: File | null) => {
    if (file == null) return;
    const isImage = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"].includes(file.type);
    if (!isImage || file.size > 5 * 1024 * 1024) {
      const msg = "Only JPEG, PNG, WebP, or GIF under 5 MB.";
      setError(msg);
      toastError(msg);
      return;
    }

    setUploadingAvatar(true);
    setError("");
    try {
      const url = await uploadProfileAvatar(file);
      setAvatarUrl(url);
      toastInfo("Avatar uploaded.");
      onSaved();
    } catch (err: unknown) {
      const e = err as Error;
      const msg = e.message || "Avatar upload failed";
      setError(msg);
      toastError(msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (open && profile) {
      resetFromProfile();
    }
  }, [open, profile, resetFromProfile]);

  const handleSave = async () => {
    setError("");
    if (!profile) {
      const msg = "Profile is still loading.";
      setError(msg);
      toastError(msg);
      return;
    }

    const pwdFilled = Boolean(
      currentPassword.trim() || newPassword.trim() || confirmPassword.trim(),
    );
    const newPwd = newPassword.trim();
    const confirmPwd = confirmPassword.trim();

    const notifyValidation = (msg: string) => {
      setError(msg);
      toastError(msg);
    };

    if (pwdFilled) {
      if (!currentPassword.trim()) {
        notifyValidation("Enter your current password to set a new one.");
        return;
      }
      if (newPwd.length < 6) {
        notifyValidation("New password must be at least 6 characters.");
        return;
      }
      if (newPwd !== confirmPwd) {
        notifyValidation("New password and confirmation do not match.");
        return;
      }
    }

    const baseBody: Record<string, string> = {};
    const fn = fullName.trim();
    if (fn.length >= 2) baseBody.fullName = fn;
    const ph = emptyToUndefined(phone);
    if (ph !== undefined) baseBody.phone = ph;
    const ci = emptyToUndefined(city);
    if (ci !== undefined) baseBody.city = ci;
    const av = avatarUrl.trim();
    if (av.length > 0) baseBody.avatarUrl = av;

    const sellerBody: Record<string, unknown> = {};
    if (showSellerSection && profile?.sellerProfile) {
      const dn = sellerDisplayName.trim();
      if (dn.length >= 2) sellerBody.displayName = dn;
      const desc = sellerDescription.trim();
      if (desc.length > 0) sellerBody.description = desc;
      const bt = sellerBusinessType.trim();
      if (bt.length > 0) sellerBody.businessType = bt;
      const w = sellerWebsite.trim();
      if (w.length > 0) sellerBody.website = w;
      const ig = sellerInstagramUrl.trim();
      if (ig.length > 0) sellerBody.instagramUrl = ig;
    }

    const buyerBody: Record<string, unknown> = {};
    if (showBuyerSection && profile?.buyerProfile) {
      const dn = buyerDisplayName.trim();
      if (dn.length >= 2) buyerBody.displayName = dn;
      const bc = buyerCity.trim();
      if (bc.length > 0) buyerBody.city = bc;
    }

    const willPatchBase = Object.keys(baseBody).length > 0;
    const willPatchSeller = Object.keys(sellerBody).length > 0;
    const willPatchBuyer = Object.keys(buyerBody).length > 0;
    const willPatchPassword =
      pwdFilled && currentPassword.trim() && newPwd.length >= 6 && newPwd === confirmPwd;

    if (!willPatchBase && !willPatchSeller && !willPatchBuyer && !willPatchPassword) {
      const msg = "Nothing to save. Change some fields or fill the password section.";
      setError(msg);
      toastInfo(msg);
      return;
    }

    setSaving(true);
    try {
      if (willPatchBase) {
        await apiFetchWithRefresh("/api/v1/profiles/me", {
          method: "PATCH",
          service: "profile",
          body: JSON.stringify(baseBody),
        });
      }
      if (willPatchSeller) {
        await apiFetchWithRefresh("/api/v1/profiles/me/seller", {
          method: "PATCH",
          service: "profile",
          activeMode: "seller",
          body: JSON.stringify(sellerBody),
        });
      }
      if (willPatchBuyer) {
        await apiFetchWithRefresh("/api/v1/profiles/me/buyer", {
          method: "PATCH",
          service: "profile",
          activeMode: "buyer",
          body: JSON.stringify(buyerBody),
        });
      }
      if (willPatchPassword) {
        await apiFetchWithRefresh("/api/v1/auth/me/password", {
          method: "PATCH",
          service: "auth",
          body: JSON.stringify({
            currentPassword: currentPassword.trim(),
            newPassword: newPwd,
          }),
        });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const e = err as Error;
      const msg = e.message || "Save failed";
      setError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={() => !saving && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="relative z-[101] flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#e7f3eb] bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#e7f3eb] px-5 py-4">
          <h2 id="edit-profile-title" className="text-lg font-bold text-[#0d1b12]">
            Edit profile
          </h2>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#4c9a66]">Account</h3>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Full name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoComplete="tel"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#0d1b12]">City</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoComplete="address-level2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Avatar URL</span>
              <div className="mb-2 flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-full border border-[#e7f3eb] bg-[#f5f6f8]">
                  {avatarUrl.trim() ? (
                    <img src={avatarUrl.trim()} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#4c9a66]">
                      {fullName.trim().slice(0, 1).toUpperCase() || user.name?.slice(0, 1).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#e7f3eb] bg-white px-3 py-2 text-sm font-bold text-[#0d1b12] hover:bg-gray-50">
                  <span className="material-symbols-outlined text-[20px]">
                    {uploadingAvatar ? "progress_activity" : "upload"}
                  </span>
                  {uploadingAvatar ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={saving || uploadingAvatar}
                    onChange={(e) => {
                      void handleAvatarUpload(e.target.files?.[0] ?? null);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
            <p className="text-xs text-gray-500">
              Email ({user.email}) cannot be changed here yet.
            </p>
          </section>

          {showSellerSection && (
            <section className="space-y-3 border-t border-[#e7f3eb] pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#4c9a66]">Seller storefront</h3>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Public display name</span>
                <input
                  value={sellerDisplayName}
                  onChange={(e) => setSellerDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Description</span>
                <textarea
                  value={sellerDescription}
                  onChange={(e) => setSellerDescription(e.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Business type</span>
                <input
                  value={sellerBusinessType}
                  onChange={(e) => setSellerBusinessType(e.target.value)}
                  className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Website</span>
                <input
                  value={sellerWebsite}
                  onChange={(e) => setSellerWebsite(e.target.value)}
                  className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Instagram URL</span>
                <input
                  value={sellerInstagramUrl}
                  onChange={(e) => setSellerInstagramUrl(e.target.value)}
                  className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <p className="text-xs text-gray-500">
                Recommendation categories are managed under <span className="font-semibold">Preferences</span> on your profile page.
              </p>
            </section>
          )}

          {showBuyerSection && (
            <section className="space-y-3 border-t border-[#e7f3eb] pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#4c9a66]">Buyer profile</h3>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Public display name</span>
                <input
                  value={buyerDisplayName}
                  onChange={(e) => setBuyerDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Buyer city</span>
                <input
                  value={buyerCity}
                  onChange={(e) => setBuyerCity(e.target.value)}
                  className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <p className="text-xs text-gray-500">
                You also have a general city field above; use buyer city for matching preferences if you keep them different.
              </p>
              <p className="text-xs text-gray-500">
                Shopping categories for showcase recommendations are under <span className="font-semibold">Preferences</span> on your profile page.
              </p>
            </section>
          )}

          <section className="space-y-3 border-t border-[#e7f3eb] pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#4c9a66]">Change password</h3>
            <p className="text-xs text-gray-500">Leave blank to keep your current password.</p>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoComplete="current-password"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#0d1b12]">New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoComplete="new-password"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#0d1b12]">Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-[#e7f3eb] bg-[#f5f6f8] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoComplete="new-password"
              />
            </label>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e7f3eb] bg-[#f5f6f8] px-5 py-4 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg border border-[#e7f3eb] bg-white px-4 py-2.5 text-sm font-bold text-[#0d1b12] hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !profile}
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-black hover:bg-[#0fd650] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
