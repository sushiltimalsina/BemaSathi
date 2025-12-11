import { createContext, useContext, useState } from "react";

const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
  const [compare, setCompare] = useState([]);

  const addToCompare = (policy) => {
    setCompare((prev) => {
      if (prev.find((p) => p.id === policy.id)) return prev;
      if (prev.length === 2) return prev; // limit to 2 (previous behavior)
      return [...prev, policy];
    });
  };

  const removeFromCompare = (id) => {
    setCompare((prev) => prev.filter((p) => p.id !== id));
  };

  const clearCompare = () => setCompare([]);

  return (
    <CompareContext.Provider
      value={{ compare, addToCompare, removeFromCompare, clearCompare }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => useContext(CompareContext);
