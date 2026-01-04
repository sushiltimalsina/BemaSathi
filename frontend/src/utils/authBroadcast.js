export const AUTH_CHANNEL = "beemasathi-auth";

export const canBroadcast = () =>
  typeof window !== "undefined" && "BroadcastChannel" in window;

const postMessage = (payload) => {
  if (!canBroadcast()) return;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage(payload);
  channel.close();
};

export const broadcastAuthUpdate = (role, token, user) => {
  if (!role || !token) return;
  postMessage({ type: "auth-update", role, token, user });
};

export const broadcastLogout = (role) => {
  if (!role) return;
  postMessage({ type: "logout", role });
};
