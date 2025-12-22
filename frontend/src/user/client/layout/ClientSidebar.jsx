import React, { useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  HomeIcon,
  DocumentDuplicateIcon,
  HeartIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { name: "Dashboard", icon: <HomeIcon className="w-6" />, path: "/client/dashboard" },
  { name: "All Policies", icon: <DocumentDuplicateIcon className="w-6" />, path: "/client/policies" },
  { name: "Saved Policies", icon: <HeartIcon className="w-6" />, path: "/client/saved" },
  { name: "My Policies", icon: <ClipboardDocumentListIcon className="w-6" />, path: "/client/my-policies" },
  { name: "Payment History", icon: <BanknotesIcon className="w-6" />, path: "/client/payments" },
];

const ClientSidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {

  // Collapse by default on load
  useEffect(() => {
    setCollapsed(true);
  }, [setCollapsed]);

  return (
    <>
      {/* =========================================================
            DESKTOP SIDEBAR (Hover Expand)
      ========================================================== */}
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={`
          hidden md:flex flex-col fixed top-0 left-0 h-screen z-60
          bg-sidebar-light dark:bg-sidebar-dark
          shadow-sm transition-all duration-300 ease-in-out
          ${collapsed ? "w-20" : "w-64"}
        `}
      >

        {/* Logo (Collapsed → show BS, Expanded → hide logo) */}
        <div className="mt-6 mb-10 px-4">
          <Link
            to="/client/dashboard"
            className="text-2xl font-bold block text-primary-light dark:text-primary-dark"
          >
            {collapsed ? "BS" : ""}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-3 px-3 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `
                flex items-center gap-3 px-4 py-2 rounded-md font-medium
                text-text-light dark:text-text-dark
                hover:bg-hover-light dark:hover:bg-hover-dark
                transition-all
                ${
                  isActive
                    ? "bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark"
                    : ""
                }
              `
              }
            >
              {item.icon}
              {!collapsed && item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* =========================================================
            MOBILE SIDEBAR (Slide In/Out)
      ========================================================== */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 h-full w-64 z-999
          bg-sidebar-light dark:bg-sidebar-dark
          border-r border-border-light dark:border-border-dark
          shadow-lg transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="mt-6 mb-10 px-4">
          <Link
            to="/client/dashboard"
            className="text-2xl font-bold text-primary-light dark:text-primary-dark"
            onClick={() => setMobileOpen(false)}
          >
            BeemaSathi
          </Link>
        </div>

        {/* Menu */}
        <nav className="space-y-3 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `
                flex items-center gap-3 px-4 py-2 rounded-md font-medium
                text-text-light dark:text-text-dark
                hover:bg-hover-light dark:hover:bg-hover-dark
                transition-all
                ${
                  isActive
                    ? "bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark"
                    : ""
                }
              `
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default ClientSidebar;
