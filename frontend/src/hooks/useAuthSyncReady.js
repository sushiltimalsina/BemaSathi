import { useEffect, useState } from "react";

const useAuthSyncReady = () => {
  const [ready, setReady] = useState(!!window.__authSyncReady);

  useEffect(() => {
    if (window.__authSyncReady) {
      setReady(true);
      return;
    }

    const onReady = () => setReady(true);
    window.addEventListener("auth-sync-ready", onReady);
    return () => window.removeEventListener("auth-sync-ready", onReady);
  }, []);

  return ready;
};

export default useAuthSyncReady;
