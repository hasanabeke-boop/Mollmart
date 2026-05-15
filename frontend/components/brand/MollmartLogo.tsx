import Link from "next/link";

export const MOLLMART_ICON_SRC = "/brand/icon.svg";

type MollmartLogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  imageClassName?: string;
  wordmarkClassName?: string;
};

export function MollmartLogo({
  size = 32,
  showWordmark = false,
  className = "",
  imageClassName = "",
  wordmarkClassName = "text-lg font-bold tracking-tight text-[#0d1b12]",
}: MollmartLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MOLLMART_ICON_SRC}
        alt="Mollmart"
        width={size}
        height={size}
        className={`shrink-0 rounded-lg object-contain ${imageClassName}`.trim()}
        decoding="async"
      />
      {showWordmark ? <span className={wordmarkClassName}>Mollmart</span> : null}
    </span>
  );
}

type MollmartLogoLinkProps = MollmartLogoProps & {
  href?: string;
};

export function MollmartLogoLink({
  href = "/",
  size = 32,
  showWordmark = true,
  className = "group",
  imageClassName = "shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-110",
  wordmarkClassName = "hidden text-lg font-bold tracking-tight text-[#0d1b12] transition-colors group-hover:text-primary md:inline",
}: MollmartLogoLinkProps) {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`.trim()}>
      <MollmartLogo
        size={size}
        showWordmark={showWordmark}
        imageClassName={imageClassName}
        wordmarkClassName={wordmarkClassName}
      />
    </Link>
  );
}
