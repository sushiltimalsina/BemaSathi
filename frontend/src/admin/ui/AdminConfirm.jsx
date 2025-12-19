import React, { createContext, useContext, useMemo, useState } from "react";

const ConfirmContext = createContext(null);

export const AdminConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);

  const confirm = (message, options = {}) =>
    new Promise((resolve) => {
      setDialog({
        message,
        title: options.title || "Confirm",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        resolve,
      });
    });

  const close = (value) => {
    if (dialog?.resolve) {
      dialog.resolve(value);
    }
    setDialog(null);
  };

  const value = useMemo(() => ({ confirm }), []);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">{dialog.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              {dialog.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className="px-3 py-1 rounded-lg bg-primary-light text-white hover:bg-primary-dark text-sm"
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useAdminConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useAdminConfirm must be used within AdminConfirmProvider");
  }
  return ctx.confirm;
};
