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
  const hideGlobalFooter =
    location.pathname.startsWith("/client") ||
    location.pathname.startsWith("/admin");

  useEffect(() => {
    const isAdmin = location.pathname.startsWith("/admin");
    document.title = isAdmin ? "BeemaSathi Admin" : "BeemaSathi";
  }, [location.pathname]);

  return (
    <>
      {/* Global Navbar */}
      <Navbar />

      {/* Client compare bar */}
      <CompareBar />

      {/* Routes */}
      <AppRoutes />

      {/* Global Footer */}
      {!hideGlobalFooter && <Footer />}
    </>
  );
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
