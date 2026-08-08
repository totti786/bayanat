"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; title: string; description?: string; variant?: "success" | "error" };

const ToastContext = createContext<{ toast: (t: Omit<Toast, "id">) => void }>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext).toast;
}

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { ...t, variant: t.variant ?? "success", id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${
              t.variant === "error"
                ? "border-red-200 bg-red-50/95 text-red-800"
                : "border-emerald-200 bg-emerald-50/95 text-emerald-800"
            }`}
          >
            <p className="text-sm font-semibold">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs opacity-80">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
