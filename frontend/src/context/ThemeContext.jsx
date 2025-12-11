import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext();

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const getInitialMode = () => {
  const saved = localStorage.getItem("themeMode");
  if (saved === "light" || saved === "dark" || saved === "system") {
    return saved;
  }
  return "light"; // default
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode); // user choice: light | dark | system
  const [systemTheme, setSystemTheme] = useState(getSystemTheme); // OS theme

  const theme = mode === "system" ? systemTheme : mode; // final theme applied
  const isDark = theme === "dark";

  // Apply "dark" class to <html>
  useLayoutEffect(() => {
    const root = document.documentElement;

    // Tailwind dark mode works ONLY on <html>
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");

    // Save preference
    localStorage.setItem("themeMode", mode);

    // Fix color scheme for forms/scrollbars
    root.style.colorScheme = isDark ? "dark" : "light";

    // Ensure <body> never receives wrong class
    document.body.classList.remove("dark");
  }, [isDark, mode]);

  // Detect system theme changes (dynamic)
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  // Auto-sync across tabs (Chrome, Edge, Firefox)
  useEffect(() => {
    const syncHandler = (e) => {
      if (e.key === "themeMode") {
        setMode(e.newValue);
      }
    };
    window.addEventListener("storage", syncHandler);
    return () => window.removeEventListener("storage", syncHandler);
  }, []);

  // Toggle: light → dark → system → light
  const cycleMode = () => {
    setMode((prev) =>
      prev === "light" ? "dark" : prev === "dark" ? "system" : "light"
    );
  };

  const value = useMemo(
    () => ({
      mode,
      theme,
      isDark,
      setMode,
      cycleMode,
    }),
    [mode, theme, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
