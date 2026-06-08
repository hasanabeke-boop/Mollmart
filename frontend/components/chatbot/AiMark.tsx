type AiMarkProps = {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "badge" | "plain";
  className?: string;
};

const sizeClasses = {
  xs: { badge: "size-7 rounded-md text-[10px]", plain: "text-[10px]" },
  sm: { badge: "size-8 rounded-lg text-[11px]", plain: "text-[11px]" },
  md: { badge: "size-9 rounded-lg text-xs", plain: "text-xs" },
  lg: { badge: "size-11 rounded-xl text-sm", plain: "text-sm" },
} as const;

export default function AiMark({ size = "md", variant = "badge", className = "" }: AiMarkProps) {
  const s = sizeClasses[size];

  if (variant === "plain") {
    return (
      <span
        className={`inline-flex items-center justify-center font-semibold tracking-tight ${s.plain} ${className}`}
        aria-hidden
      >
        AI
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center border border-primary/20 bg-primary/8 font-semibold tracking-tight text-primary ${s.badge} ${className}`}
      aria-hidden
    >
      AI
    </span>
  );
}
