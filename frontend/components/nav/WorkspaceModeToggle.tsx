'use client';

import { useWorkspace } from "@/context/WorkspaceContext";

type Props = {
  /** Smaller toggle for the mobile workspace bar */
  compact?: boolean;
};

export default function WorkspaceModeToggle({ compact = false }: Props) {
  const { hasDualWorkspace, visualMode, setActiveMode, isModeTransitioning } = useWorkspace();

  if (!hasDualWorkspace) return null;

  const isSeller = visualMode === "seller";

  return (
    <div
      className={`workspace-toggle relative grid shrink-0 grid-cols-2 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-0.5 font-bold ${
        compact
          ? "min-w-[6.25rem] text-[9px]"
          : "min-w-[7.25rem] text-[10px] sm:min-w-[8rem] sm:text-xs"
      }`}
      role="group"
      aria-label="Workspace mode"
    >
      <span
        aria-hidden
        className={`workspace-toggle__thumb ${isSeller ? "workspace-toggle__thumb--seller" : ""}`}
      />
      <button
        type="button"
        disabled={isModeTransitioning}
        onClick={() => setActiveMode("buyer")}
        aria-pressed={!isSeller}
        className={`workspace-toggle__btn ${!isSeller ? "workspace-toggle__btn--active" : ""}`}
      >
        Buyer
      </button>
      <button
        type="button"
        disabled={isModeTransitioning}
        onClick={() => setActiveMode("seller")}
        aria-pressed={isSeller}
        className={`workspace-toggle__btn ${isSeller ? "workspace-toggle__btn--active" : ""}`}
      >
        Seller
      </button>
    </div>
  );
}
