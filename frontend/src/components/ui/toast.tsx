"use client";

import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/types/ui";

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;

export type ToastOptions = {
  title: string;
  description?: string;
  tone?: Tone;
  duration?: number;
};

type Toast = ToastOptions & { id: number };

type Action = { type: "add"; toast: Toast } | { type: "remove"; id: number };

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case "add":
      // Keep the newest; drop the oldest once the stack is full.
      return [...state, action.toast].slice(-MAX_VISIBLE);
    case "remove":
      return state.filter((toast) => toast.id !== action.id);
  }
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used inside <ToastProvider>.");
  return toast;
}

const TONES: Record<Tone, string> = {
  neutral: "border-border",
  accent: "border-accent",
  success: "border-success",
  danger: "border-danger",
  warning: "border-warning",
  info: "border-info",
};

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = nextId++;
    dispatch({ type: "add", toast: { ...options, id } });

    const duration = options.duration ?? DEFAULT_DURATION;
    if (duration > 0) {
      setTimeout(() => dispatch({ type: "remove", id }), duration);
    }
  }, []);

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-md bottom-md z-[--z-toast] flex flex-col gap-xs"
        // Errors interrupt the screen reader; the rest wait for a pause.
        aria-live="polite"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.tone === "danger" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-72 flex-col gap-3xs rounded-md border-l-2 bg-surface-raised px-sm py-xs shadow-lg",
              TONES[item.tone ?? "neutral"],
            )}
          >
            <p className="text-sm font-medium text-fg">{item.title}</p>
            {item.description ? (
              <p className="text-xs text-fg-muted">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
