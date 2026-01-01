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

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xl font-bold text-primary-light dark:text-primary-dark">
          <Link to="dashboard">
            BemaSathi
          </Link>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
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
  );
};

export default Sidebar;
