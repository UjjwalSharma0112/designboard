"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ToastType = "error" | "success";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "error") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Automatically remove after 4 seconds
    setTimeout(() => {
      hideToast(id);
    }, 4000);
  }, [hideToast]);

  const typeStyles = {
    error: "border-warn bg-surface/85 text-warn",
    success: "border-accent/40 bg-surface/85 text-accent",
  };

  const dotStyles = {
    error: "bg-warn",
    success: "bg-accent",
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-2.5 rounded-card border px-4 py-3 shadow-lift font-mono text-xs pointer-events-auto min-w-[280px] justify-between ${typeStyles[toast.type]}`}
              role="alert"
            >
              <div className="flex items-center gap-2.5">
                <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${dotStyles[toast.type]}`} />
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => hideToast(toast.id)}
                className="ml-4 hover:text-fg text-faint cursor-pointer font-bold text-sm"
                aria-label="Close message"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
