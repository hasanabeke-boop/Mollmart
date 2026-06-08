import type { User } from "@/context/AuthContext";

/** Default route after login or when a signed-in user hits a public-only page (e.g. landing). */
export function getAuthenticatedHomePath(
  user: Pick<User, "role" | "activeWorkspaceMode" | "hasDualWorkspace" | "canBuy" | "canSell">,
): string {
  if (user.role === "admin") return "/admin";
  if (user.hasDualWorkspace && user.activeWorkspaceMode === "seller") {
    return "/seller/dashboard";
  }
  if (user.role === "seller" || (user.canSell && user.canBuy === false)) {
    return "/browse-buyer-requests";
  }
  return "/my-requests";
}
