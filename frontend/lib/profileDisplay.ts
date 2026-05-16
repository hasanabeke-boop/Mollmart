import type { User } from "@/context/AuthContext";
import type { ProfileMeResponse } from "@/components/profile/EditProfileModal";

export function isProfileNamePlaceholder(name: string, userId: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (trimmed === userId) return true;
  return false;
}

/** Best label for profile header: profile fullName / role displayName, then auth name, then email local-part. */
export function resolveAccountDisplayName(
  profile: ProfileMeResponse | null,
  user: Pick<User, "id" | "name" | "email">,
  activeRole?: "buyer" | "seller" | "admin",
): string {
  const authName = user.name?.trim();
  const emailLocal = user.email?.split("@")[0]?.trim();

  if (profile) {
    const candidates: string[] = [];

    const pushIfValid = (value: string | null | undefined) => {
      const trimmed = (value ?? "").trim();
      if (!isProfileNamePlaceholder(trimmed, user.id)) {
        candidates.push(trimmed);
      }
    };

    pushIfValid(profile.fullName);

    if (activeRole === "seller") {
      pushIfValid(profile.sellerProfile?.displayName);
    } else if (activeRole === "buyer") {
      pushIfValid(profile.buyerProfile?.displayName);
    } else {
      pushIfValid(profile.sellerProfile?.displayName);
      pushIfValid(profile.buyerProfile?.displayName);
    }

    const fromProfile = candidates[0];
    if (fromProfile) return fromProfile;
  }

  return authName || emailLocal || "User";
}
