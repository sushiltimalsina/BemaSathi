import { useEffect, useRef } from "react";

/**
 * useIdleLogout
 *
 * Session expiry rules:
 * - While the tab is VISIBLE and FOCUSED → session is always kept alive. Timer never runs.
 * - When the tab is HIDDEN or the window is BLURRED → idle countdown begins.
 * - After `timeoutMs` ms of the tab being hidden with no activity → logout fires.
 *
 * @param {boolean} enabled
 * @param {function} onLogout
 * @param {string} activityKey - localStorage key for last-activity timestamp
 * @param {string} tokenKey - sessionStorage/localStorage key for auth token
 * @param {number} timeoutMs - inactivity threshold while tab is hidden (default: 5 min)
 * @param {AxiosInstance} apiClient - Optional client for server-side heartbeats
 */
const useIdleLogout = ({
  enabled,
  onLogout,
  activityKey,
  tokenKey,
  timeoutMs = 5 * 60 * 1000,
  apiClient,
}) => {
  const logoutRef = useRef(onLogout);
  const lastHeartbeatRef = useRef(0);
  const lastWriteRef = useRef(0);

  // Keep logoutRef current
  useEffect(() => {
    logoutRef.current = onLogout;
  }, [onLogout]);

  useEffect(() => {
    if (!enabled) return;

    // ─── Core: stamp now as the last activity ──────────────────────────────
    const stampActivity = (force = false) => {
      const now = Date.now();
      // Throttle writes: at most once every 30s unless forced
      if (!force && now - lastWriteRef.current < 30000) return;
      lastWriteRef.current = now;
      localStorage.setItem(activityKey, now.toString());

      // Server-side heartbeat every 2 minutes while active
      if (apiClient && now - lastHeartbeatRef.current > 2 * 60 * 1000) {
        lastHeartbeatRef.current = now;
        const endpoint = apiClient.defaults.baseURL?.includes("htt")
          ? "/htt/profile"
          : "/me";
        apiClient.get(endpoint).catch(() => {});
      }
    };

    // ─── While page is VISIBLE: keep stamping every 30s ───────────────────
    let visibilityKeepAlive = null;

    const startKeepAlive = () => {
      // Stamp immediately when tab becomes visible
      stampActivity(true);
      // Then keep stamping every 30s so idle diff never grows
      visibilityKeepAlive = setInterval(() => stampActivity(true), 30000);
    };

    const stopKeepAlive = () => {
      clearInterval(visibilityKeepAlive);
      visibilityKeepAlive = null;
      // Stamp one last time so the idle clock starts from right now
      stampActivity(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startKeepAlive();
      } else {
        stopKeepAlive();
      }
    };

    const handleFocus = () => stampActivity(true);
    const handleBlur = () => stampActivity(true); // stamp on blur so countdown starts from now

    // Start keep-alive immediately if tab is already visible
    if (document.visibilityState === "visible") {
      startKeepAlive();
    } else {
      stampActivity(true);
    }

    // User interaction events — stamp activity (throttled)
    const interactionEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    interactionEvents.forEach((evt) => window.addEventListener(evt, stampActivity));

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // ─── Idle check: only fire logout when tab is hidden & truly idle ──────
    const checkIdle = () => {
      // While tab is visible → NEVER logout
      if (document.visibilityState === "visible") return;

      const token =
        sessionStorage.getItem(tokenKey) || localStorage.getItem(tokenKey);
      if (!token) return;

      const lastActivity = Number(localStorage.getItem(activityKey));
      if (!lastActivity || isNaN(lastActivity)) return;

      if (Date.now() - lastActivity > timeoutMs) {
        logoutRef.current();
      }
    };

    const idleInterval = setInterval(checkIdle, 10000);

    return () => {
      clearInterval(idleInterval);
      clearInterval(visibilityKeepAlive);
      interactionEvents.forEach((evt) =>
        window.removeEventListener(evt, stampActivity)
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled, activityKey, tokenKey, timeoutMs, apiClient]);
};

export default useIdleLogout;
