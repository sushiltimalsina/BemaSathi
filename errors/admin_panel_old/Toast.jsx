import React, { useEffect } from "react";

const Toast = ({ toasts = [], removeToast }) => {
  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => removeToast(t.id), t.duration || 3000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type || "info"}`}>
          <div className="toast-title">{toast.title}</div>
          {toast.message && <div className="toast-message">{toast.message}</div>}
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
