import { useEffect } from "react";

// Simple inactivity logout hook. Tracks user activity in localStorage and logs out after timeout.
const useIdleLogout = ({
  enabled,
  onLogout,
  activityKey,
  tokenKey,
  timeoutMs = 5 * 60 * 1000, // 5 minutes
}) => {
  useEffect(() => {
    if (!enabled) return;

    const markActivity = () =>
      localStorage.setItem(activityKey, Date.now().toString());

    // Initialize last activity
    markActivity();

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, markActivity));

    const checkIdle = () => {
      const token = localStorage.getItem(tokenKey);
      if (!token) return;

      const last = Number(localStorage.getItem(activityKey));
      if (!Number.isFinite(last)) {
        markActivity();
        return;
      }

      if (Date.now() - last > timeoutMs) {
        onLogout();
      }
    };

    // Check every minute
    const interval = setInterval(checkIdle, 60 * 1000);

    const onStorage = (e) => {
      if (e.key === tokenKey && !e.newValue) {
        onLogout();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, markActivity));
      clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, [enabled, onLogout, activityKey, tokenKey, timeoutMs]);
};

export default useIdleLogout;
