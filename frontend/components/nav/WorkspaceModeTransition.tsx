'use client';

import { type ReactNode } from "react";
import { useWorkspaceOptional } from "@/context/WorkspaceContext";

export default function WorkspaceModeTransition({ children }: { children: ReactNode }) {
  const workspace = useWorkspaceOptional();
  const visible = workspace?.modeScreenVisible ?? true;

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col self-stretch">
      <div
        className={`workspace-screen-fade flex min-h-0 min-h-full min-w-0 flex-1 flex-col self-stretch ${
          visible ? "workspace-screen-fade--visible" : "workspace-screen-fade--hidden"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
