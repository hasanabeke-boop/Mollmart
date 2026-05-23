'use client';

import { useWorkspace } from "@/context/WorkspaceContext";

export default function WorkspaceModeToggle() {
  const { hasDualWorkspace, visualMode, setActiveMode, isModeTransitioning } = useWorkspace();

  if (!hasDualWorkspace) return null;

  const isSeller = visualMode === "seller";

  return (
    <div
      className="workspace-toggle relative grid min-w-[7.25rem] shrink-0 grid-cols-2 rounded-md border border-gray-200 bg-gray-50 p-0.5 text-[10px] font-bold sm:min-w-[8rem] sm:text-xs"
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
