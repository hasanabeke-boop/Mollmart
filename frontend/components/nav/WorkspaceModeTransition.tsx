'use client';

import { type ReactNode } from "react";
import { useWorkspaceOptional } from "@/context/WorkspaceContext";

export default function WorkspaceModeTransition({ children }: { children: ReactNode }) {
  const workspace = useWorkspaceOptional();
  const visible = workspace?.modeScreenVisible ?? true;

  return (
    <div className="relative min-w-0 self-stretch">
      <div
        className={`workspace-screen-fade min-w-0 self-stretch ${
          visible ? "workspace-screen-fade--visible" : "workspace-screen-fade--hidden"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
