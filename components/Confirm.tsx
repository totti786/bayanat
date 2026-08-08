"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ConfirmOptions = { title: string; description?: string; confirmLabel?: string };

const ConfirmContext = createContext<(opts: ConfirmOptions) => Promise<boolean>>(
  async () => false
);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setState(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function close(result: boolean) {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900">{state.title}</h3>
            {state.description && (
              <p className="mt-1 text-sm text-neutral-500">{state.description}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => close(false)}
                className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={() => close(true)}
                className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {state.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
