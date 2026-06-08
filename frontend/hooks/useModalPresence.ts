'use client';

import { useEffect, useState } from "react";

/**
 * Keeps modal mounted briefly after `open` becomes false so exit transitions can run.
 */
export function useModalPresence(open: boolean, exitMs = 240) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        setMounted(true);
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }
    const id = requestAnimationFrame(() => setVisible(false));
    const t = window.setTimeout(() => setMounted(false), exitMs);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(t);
    };
  }, [open, exitMs]);

  return { mounted, visible };
}
