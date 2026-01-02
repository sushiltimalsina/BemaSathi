import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  HomeIcon,
  ShieldCheckIcon,
  UsersIcon,
  BuildingOffice2Icon,
  ArrowPathIcon,
  BanknotesIcon,
  UserGroupIcon,
  BellIcon,
  ChartBarSquareIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  EnvelopeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: HomeIcon },
  { name: "Policies", path: "/admin/policies", icon: ShieldCheckIcon },
  { name: "Agents", path: "/admin/agents", icon: UsersIcon },
  { name: "Companies", path: "/admin/companies", icon: BuildingOffice2Icon },
  { name: "Renewals", path: "/admin/renewals", icon: ArrowPathIcon },
  { name: "Payments", path: "/admin/payments", icon: BanknotesIcon },
  { name: "Agent Inquiries", path: "/admin/agent-inquiries", icon: EnvelopeIcon },
  { name: "Users", path: "/admin/users", icon: UserGroupIcon },
  { name: "Notifications", path: "/admin/notifications", icon: BellIcon },
  { name: "Reports", path: "/admin/reports", icon: ChartBarSquareIcon },
  { name: "Audit Log", path: "/admin/audit", icon: ClipboardDocumentListIcon },
  { name: "Settings", path: "/admin/settings", icon: Cog6ToothIcon },
  { name: "Support", path: "/admin/support", icon: LifebuoyIcon },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xl font-bold text-primary-light dark:text-primary-dark">
            <Link to="dashboard">BeemaSathi</Link>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `
                flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium
                transition
                ${
                  isActive
                    ? "bg-primary-light/10 text-primary-light dark:text-primary-dark"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }
              `
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
