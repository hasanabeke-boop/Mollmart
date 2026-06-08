"use client";

import type { FormEvent, ReactNode } from "react";

export const searchInputClassName =
  "h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 pl-10 pr-10 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

const widthClass = {
  narrow: "max-w-sm",
  default: "max-w-xl",
  wide: "max-w-2xl",
  full: "max-w-full",
} as const;

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  clearable?: boolean;
  width?: keyof typeof widthClass;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  id,
  name,
  onSubmit,
  clearable = true,
  width = "default",
  className = "",
  inputClassName = searchInputClassName,
  "aria-label": ariaLabel,
}: SearchFieldProps) {
  const field = (
    <div className={`relative min-w-0 w-full ${widthClass[width]} ${className}`}>
      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[var(--text-muted)]">
        search
      </span>
      <input
        id={id}
        name={name}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={inputClassName}
      />
      {clearable && value.trim().length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          aria-label="Clear search"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );

  if (onSubmit) {
    return (
      <form onSubmit={onSubmit} className="min-w-0">
        {field}
      </form>
    );
  }

  return field;
}

export function SearchBarRow({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">{children}</div>
      {meta ? <div className="shrink-0 text-xs text-[var(--text-muted)] sm:text-sm">{meta}</div> : null}
    </div>
  );
}
