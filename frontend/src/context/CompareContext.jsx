import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
  const [compare, setCompare] = useState([]);
  const [compareError, setCompareError] = useState("");
  const lastUserIdRef = useRef(null);
  const errorTimerRef = useRef(null);

  const addToCompare = (policy) => {
    setCompare((prev) => {
      if (prev.find((p) => p.id === policy.id)) return prev;
      if (prev.length === 2) return prev; // limit to 2 (previous behavior)
      if (
        prev.length > 0 &&
        prev[0]?.insurance_type &&
        policy?.insurance_type &&
        prev[0].insurance_type !== policy.insurance_type
      ) {
        setCompareError(
          "Please select policies of the same type of policy to compare."
        );
        if (errorTimerRef.current) {
          clearTimeout(errorTimerRef.current);
        }
        errorTimerRef.current = setTimeout(() => {
          setCompareError("");
        }, 5000);
        return prev;
      }
      return [...prev, policy];
    });
  };

  const removeFromCompare = (id) => {
    setCompare((prev) => prev.filter((p) => p.id !== id));
  };

  const clearCompare = useCallback(() => {
    setCompare([]);
    setCompareError("");
  }, []);

  useEffect(() => {
    const getUserId = () => {
      const raw = sessionStorage.getItem("client_user");
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed?.id ?? parsed?._id ?? parsed?.user_id ?? null;
      } catch {
        return null;
      }
    };

    const syncCompareWithAuth = () => {
      const token = sessionStorage.getItem("client_token");
      const userId = token ? getUserId() : null;

      if (!token || !userId) {
        if (lastUserIdRef.current !== null) {
          setCompare([]);
        }
        lastUserIdRef.current = null;
        return;
      }

      if (
        lastUserIdRef.current &&
        String(lastUserIdRef.current) !== String(userId)
      ) {
        setCompare([]);
      }

      lastUserIdRef.current = userId;
    };

    syncCompareWithAuth();
    window.addEventListener("auth-sync", syncCompareWithAuth);
    return () => window.removeEventListener("auth-sync", syncCompareWithAuth);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        compare,
        addToCompare,
        removeFromCompare,
        clearCompare,
        compareError,
        setCompareError,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => useContext(CompareContext);
