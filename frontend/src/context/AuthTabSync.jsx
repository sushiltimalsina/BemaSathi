import { useEffect } from "react";
import { AUTH_CHANNEL, canBroadcast } from "../utils/authBroadcast";

const ROLE_KEYS = {
  client: { token: "client_token", user: "client_user" },
  admin: { token: "admin_token", user: "admin_user" },
};

const notifyAuthSync = () => {
  window.dispatchEvent(new Event("auth-sync"));
};

const setSessionAuth = (role, token, user) => {
  if (!ROLE_KEYS[role] || !token) return;
  const { token: tokenKey, user: userKey } = ROLE_KEYS[role];
  sessionStorage.setItem(tokenKey, token);
  if (user) {
    sessionStorage.setItem(userKey, user);
  }
  notifyAuthSync();
};

const clearSessionAuth = (role) => {
  if (!ROLE_KEYS[role]) return;
  const { token: tokenKey, user: userKey } = ROLE_KEYS[role];
  sessionStorage.removeItem(tokenKey);
  sessionStorage.removeItem(userKey);
  notifyAuthSync();
};

const getSessionPayload = (role) => {
  if (!ROLE_KEYS[role]) return null;
  const { token: tokenKey, user: userKey } = ROLE_KEYS[role];
  return {
    role,
    token: sessionStorage.getItem(tokenKey),
    user: sessionStorage.getItem(userKey),
  };
};

const AuthTabSync = () => {
  useEffect(() => {
    ["client_token", "client_user", "admin_token", "admin_user"].forEach((key) => {
      localStorage.removeItem(key);
    });

    if (!canBroadcast()) {
      window.__authSyncReady = true;
      window.dispatchEvent(new Event("auth-sync-ready"));
      return;
    }

    window.__authSyncReady = false;
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.onmessage = (event) => {
      const msg = event?.data;
      if (!msg || !ROLE_KEYS[msg.role]) return;

      if (msg.type === "request-auth") {
        const payload = getSessionPayload(msg.role);
        if (payload?.token) {
          channel.postMessage({ type: "auth-response", ...payload });
        }
        return;
      }

      if (msg.type === "auth-response" || msg.type === "auth-update") {
        if (msg.token) {
          setSessionAuth(msg.role, msg.token, msg.user);
        }
        window.__authSyncReady = true;
        window.dispatchEvent(new Event("auth-sync-ready"));
        return;
      }

      if (msg.type === "logout") {
        clearSessionAuth(msg.role);
      }
    };

    Object.keys(ROLE_KEYS).forEach((role) => {
      channel.postMessage({ type: "request-auth", role });
    });

    const timeoutId = setTimeout(() => {
      if (!window.__authSyncReady) {
        window.__authSyncReady = true;
        window.dispatchEvent(new Event("auth-sync-ready"));
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      channel.close();
    };
  }, []);

  return null;
};

export default AuthTabSync;
