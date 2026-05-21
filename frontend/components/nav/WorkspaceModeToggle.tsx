'use client';

import { useEffect, useRef } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function WorkspaceModeToggle() {
  const { hasDualWorkspace, visualMode, setActiveMode, isModeTransitioning } = useWorkspace();
  const toggleRef = useRef<HTMLDivElement | null>(null);
  const skipThumbAnimRef = useRef(true);

  useEffect(() => {
    if (skipThumbAnimRef.current) {
      skipThumbAnimRef.current = false;
      return;
    }
    const toggle = toggleRef.current;
    if (toggle == null) return;
    toggle.classList.add("workspace-toggle--animating");
    const t = window.setTimeout(() => toggle.classList.remove("workspace-toggle--animating"), 520);
    return () => window.clearTimeout(t);
  }, [visualMode]);

  if (!hasDualWorkspace) return null;

  const isSeller = visualMode === "seller";

  return (
    <div
      ref={toggleRef}
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
