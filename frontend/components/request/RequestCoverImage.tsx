type RequestCoverImageProps = {
  src?: string;
  alt: string;
  variant?: "card" | "featured";
  className?: string;
};

const frameClass = {
  card: "aspect-[5/3] w-full",
  featured: "aspect-[5/3] w-full md:aspect-square md:w-56 lg:w-64 shrink-0",
} as const;

export default function RequestCoverImage({
  src,
  alt,
  variant = "card",
  className = "",
}: RequestCoverImageProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-[var(--surface-muted)] ${frameClass[variant]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)]">
          <span className="material-symbols-outlined text-3xl opacity-35">image</span>
        </div>
      )}
    </div>
  );
}
