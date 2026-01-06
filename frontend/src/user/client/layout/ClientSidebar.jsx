import React, { useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  HomeIcon,
  DocumentDuplicateIcon,
  HeartIcon,
  Squares2X2Icon,
  CreditCardIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  CurrencyRupeeIcon,
  CurrencyBangladeshiIcon,
  DocumentCurrencyRupeeIcon,
} from "@heroicons/react/24/outline";
import { ShieldExclamationIcon, Square2StackIcon } from "@heroicons/react/24/solid";

/* -------------------------------------------------
   ROUTES — EXACT MATCH WITH PHP SIDEBAR
-------------------------------------------------- */
const navItems = [
  { name: "Dashboard", path: "/client/dashboard", icon: <HomeIcon className="w-6 h-6" /> },
  { name: "All Policies", path: "/client/policies", icon: <DocumentDuplicateIcon className="w-6 h-6" /> },
  { name: "Saved Policies", path: "/client/saved", icon: <HeartIcon className="w-6 h-6" /> },
  { name: "My Policies", path: "/client/my-policies", icon: <ShieldCheckIcon className="w-6 h-6" /> },
  { name: "Payment History", path: "/client/payments", icon: <CreditCardIcon className="w-6 h-6" /> },
];

const ClientSidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {

  // Same default behavior as PHP
  useEffect(() => {
    setCollapsed(true);
  }, [setCollapsed]);

  // Push layout (NO overlay)
  useEffect(() => {
    if (!collapsed) {
      document.body.classList.add("client-sidebar-expanded");
    } else {
      document.body.classList.remove("client-sidebar-expanded");
    }

    return () => {
      document.body.classList.remove("client-sidebar-expanded");
    };
  }, [collapsed]);

  return (
    <>
      {/* ============================================
          DESKTOP SIDEBAR
      ============================================ */}
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={`
          hidden md:flex flex-col fixed top-0 left-0 h-screen z-50
          bg-sidebar-light dark:bg-sidebar-dark
          border-r border-border-light dark:border-border-dark
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        {/* LOGO (FIXED HEIGHT → prevents nav jump) */}
        <div className="h-20 flex items-center px-4">
          <Link
                    to="/"
                    className="text-2xl font-bold text-primary-light dark:text-primary-dark flex items-center space-x-2"
                  >
                    <img src="/logo.png" alt="BeemaSathi Logo" className="h-8 w-8" />
                    
                  </Link>
        </div>

        {/* NAVIGATION (POSITION NEVER CHANGES) */}
        <nav className="space-y-2 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2 rounded-md font-medium
                text-text-light dark:text-text-dark
                hover:bg-hover-light dark:hover:bg-hover-dark
                transition
                ${
                  isActive
                    ? "bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark"
                    : ""
                }
              `}
            >
              {item.icon}
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ============================================
          MOBILE SIDEBAR
      ============================================ */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 h-full w-64 z-50
          bg-sidebar-light dark:bg-sidebar-dark
          border-r border-border-light dark:border-border-dark
          shadow-lg transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div className="h-20 flex items-center justify-between px-4">
          <Link
            to="/client/dashboard"
            className="text-2xl font-bold text-primary-light dark:text-primary-dark"
            onClick={() => setMobileOpen(false)}
          >
            BeemaSathi
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="text-xl font-bold"
            aria-label="Close menu"
          >
            &times;
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="space-y-2 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2 rounded-md font-medium
                text-text-light dark:text-text-dark
                hover:bg-hover-light dark:hover:bg-hover-dark
                transition
                ${
                  isActive
                    ? "bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark"
                    : ""
                }
              `}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default ClientSidebar;
