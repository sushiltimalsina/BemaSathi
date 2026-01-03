import React, { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import AppRoutes from "./routes";

// Providers
import { AdminAuthProvider } from "./admin/context/AdminAuthContext";
import { ToastProvider } from "./admin/context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CompareProvider } from "./context/CompareContext";

// Global components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CompareBar from "./user/client/components/CompareBar";

const AppShell = () => {
  const location = useLocation();

  const isAdmin = location.pathname.startsWith("/admin");
  const isClient = location.pathname.startsWith("/client");

  const hideGlobalFooter = isClient || isAdmin;

  useEffect(() => {
    document.title = isAdmin ? "BeemaSathi Admin" : "BeemaSathi";
  }, [isAdmin]);

  return (
    <>
      {/* Global Navbar */}
      <Navbar />

      {/* Client compare bar (only show in /client routes) */}
      {isClient && <CompareBar />}

      {/* Routes */}
      <AppRoutes />

      {/* Global Footer */}
      {!hideGlobalFooter && <Footer />}
    </>
  );
};

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname, search]);

  return null;
};

const AppFrame = () => {
  return (
    <div
      className="
        min-h-screen
        bg-background-light dark:bg-background-dark
        text-text-light dark:text-text-dark
        transition-colors duration-300
      "
    >
      <ToastProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AppShell />
          </BrowserRouter>
        </AdminAuthProvider>
      </ToastProvider>
    </div>
  );
};

function App() {
  return (
    <CompareProvider>
      <ThemeProvider>
        <AppFrame />
      </ThemeProvider>
    </CompareProvider>
  );
}

export default App;
