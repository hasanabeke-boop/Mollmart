'use client';



import {

  createContext,

  useCallback,

  useContext,

  useMemo,

  useRef,

  useState,

  type ReactNode,

} from "react";



export type ToastVariant = "success" | "error" | "info";



type ToastItem = {

  id: string;

  message: string;

  variant: ToastVariant;

  exiting?: boolean;

};



type ToastContextValue = {

  toast: (message: string, variant?: ToastVariant) => void;

  success: (message: string) => void;

  error: (message: string) => void;

  info: (message: string) => void;

};



const ToastContext = createContext<ToastContextValue | null>(null);



const VARIANT_STYLES: Record<ToastVariant, string> = {

  success:

    "border-emerald-200 bg-emerald-50 text-emerald-900 shadow-emerald-900/10",

  error: "border-red-200 bg-red-50 text-red-900 shadow-red-900/10",

  info: "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-slate-900/10",

};



const VARIANT_ICON: Record<ToastVariant, string> = {

  success: "check_circle",

  error: "error",

  info: "info",

};



const EXIT_MS = 300;



export function ToastProvider({ children }: { children: ReactNode }) {

  const [items, setItems] = useState<ToastItem[]>([]);

  const timers = useRef<Map<string, number>>(new Map());

  const exitTimers = useRef<Map<string, number>>(new Map());



  const removeFromDom = useCallback((id: string) => {

    const t = timers.current.get(id);

    if (t) clearTimeout(t);

    timers.current.delete(id);

    const et = exitTimers.current.get(id);

    if (et) clearTimeout(et);

    exitTimers.current.delete(id);

    setItems((prev) => prev.filter((x) => x.id !== id));

  }, []);



  const dismiss = useCallback(

    (id: string) => {

      setItems((prev) => {

        const exists = prev.some((x) => x.id === id);

        if (!exists) return prev;

        return prev.map((x) => (x.id === id ? { ...x, exiting: true } : x));

      });



      const t = timers.current.get(id);

      if (t) clearTimeout(t);

      timers.current.delete(id);



      const existingExit = exitTimers.current.get(id);

      if (existingExit) clearTimeout(existingExit);

      const exitId = window.setTimeout(() => removeFromDom(id), EXIT_MS);

      exitTimers.current.set(id, exitId);

    },

    [removeFromDom],

  );



  const toast = useCallback(

    (message: string, variant: ToastVariant = "info") => {

      const id =

        typeof crypto !== "undefined" && crypto.randomUUID

          ? crypto.randomUUID()

          : String(Date.now()) + Math.random().toString(36).slice(2);

      setItems((prev) => [...prev, { id, message, variant }]);

      const timer = window.setTimeout(() => dismiss(id), 4200);

      timers.current.set(id, timer);

    },

    [dismiss],

  );



  const value = useMemo<ToastContextValue>(

    () => ({

      toast,

      success: (m) => toast(m, "success"),

      error: (m) => toast(m, "error"),

      info: (m) => toast(m, "info"),

    }),

    [toast],

  );



  return (

    <ToastContext.Provider value={value}>

      {children}

      <div

        className="pointer-events-none fixed bottom-4 right-4 z-[200] flex max-w-[min(420px,calc(100vw-2rem))] flex-col gap-2"

        aria-live="polite"

      >

        {items.map((t) => (

          <div

            key={t.id}

            className={`pointer-events-auto flex origin-right items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg transition-shadow ${VARIANT_STYLES[t.variant]} ${t.exiting ? "toast-exit" : "toast-enter"}`}

            role="status"

          >

            <span className="material-symbols-outlined shrink-0 text-[22px] opacity-90">

              {VARIANT_ICON[t.variant]}

            </span>

            <p className="min-w-0 flex-1 pt-0.5 leading-snug">{t.message}</p>

            <button

              type="button"

              onClick={() => dismiss(t.id)}

              className="shrink-0 rounded-lg p-0.5 opacity-60 transition-opacity hover:opacity-100"

              aria-label="Dismiss"

            >

              <span className="material-symbols-outlined text-[18px]">close</span>

            </button>

          </div>

        ))}

      </div>

    </ToastContext.Provider>

  );

}



export function useToast() {

  const ctx = useContext(ToastContext);

  if (!ctx) {

    throw new Error("useToast must be used within ToastProvider");

  }

  return ctx;

}


