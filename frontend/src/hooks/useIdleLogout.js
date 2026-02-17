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
      const token = sessionStorage.getItem(tokenKey);
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

    // Check every 30 seconds
    const interval = setInterval(checkIdle, 30 * 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, markActivity));
      clearInterval(interval);
    };
  }, [enabled, onLogout, activityKey, tokenKey, timeoutMs]);
};

export default useIdleLogout;
