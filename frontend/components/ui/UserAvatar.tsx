import { resolveUploadedAssetUrl } from "@/lib/api";

type UserAvatarSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<UserAvatarSize, string> = {
  sm: "size-8 text-sm",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 md:size-28 text-2xl",
};

function initials(name: string, email?: string | null): string {
  const source = name.trim() || email?.trim() || "U";
  return source.charAt(0).toUpperCase();
}

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
};

export default function UserAvatar({
  name,
  email,
  avatarUrl,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const resolvedSrc = resolveUploadedAssetUrl(avatarUrl);
  const label = name?.trim() || email?.trim() || "User";
  const sizeClass = sizeClasses[size];

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover ${className}`.trim()}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white ${className}`.trim()}
      aria-hidden
    >
      {initials(label, email)}
    </div>
  );
}
