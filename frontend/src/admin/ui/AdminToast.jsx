import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

const typeStyles = {
  success:
    "bg-emerald-600 text-white dark:bg-emerald-500/90 dark:text-slate-900",
  error:
    "bg-red-600 text-white dark:bg-red-500/90 dark:text-slate-900",
  warning:
    "bg-amber-500 text-white dark:bg-amber-400/90 dark:text-slate-900",
  info:
    "bg-blue-600 text-white dark:bg-blue-400/90 dark:text-slate-900",
};

export const AdminToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    const next = {
      id,
      type: toast.type || "info",
      title: toast.title || "",
      message: toast.message || "",
      duration: toast.duration ?? 3000,
    };
    setToasts((prev) => [...prev, next]);
    if (next.duration > 0) {
      setTimeout(() => removeToast(id), next.duration);
    }
    return id;
  }, [removeToast]);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-60 max-w-[320px] rounded-lg px-4 py-3 shadow-lg border border-white/10 dark:border-slate-900/50 ${typeStyles[t.type] || typeStyles.info}`}
          >
            {t.title && <div className="text-sm font-semibold">{t.title}</div>}
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useAdminToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used within AdminToastProvider");
  }
  return ctx;
};
