import React from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  ShieldCheckIcon,
  UsersIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  IdentificationIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: HomeIcon },
  { name: "Policies", path: "/admin/policies", icon: ShieldCheckIcon },
  { name: "Agents", path: "/admin/agents", icon: UsersIcon },
  { name: "Companies", path: "/admin/companies", icon: BuildingOffice2Icon },
  { name: "Clients", path: "/admin/clients", icon: UserGroupIcon },
  { name: "Inquiries", path: "/admin/inquiries", icon: ChatBubbleLeftRightIcon },
  { name: "Buy Requests", path: "/admin/buy-requests", icon: ShoppingBagIcon },
  { name: "KYC", path: "/admin/kyc", icon: IdentificationIcon },
  { name: "Profile", path: "/admin/profile", icon: UserCircleIcon },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xl font-bold text-primary-light dark:text-primary-dark">
          BeemaSathi
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

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs opacity-60">
        Admin Panel
      </div>
    </aside>
  );
};

export default Sidebar;
