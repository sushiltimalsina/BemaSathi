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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark p-5 shadow-xl text-text-light dark:text-text-dark">
            <h3 className="text-lg font-semibold mb-2">{dialog.title}</h3>
            <p className="text-sm opacity-80 mb-4">
              {dialog.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-3 py-1 rounded-lg border border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark text-sm"
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className="px-3 py-1 rounded-lg bg-primary-light text-white hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary-light text-sm"
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
