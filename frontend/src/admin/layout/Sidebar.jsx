import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import API from "../utils/adminApi";
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
  { name: "Dashboard", path: "/htt/dashboard", icon: HomeIcon },
  { name: "Policies", path: "/htt/policies", icon: ShieldCheckIcon },
  { name: "Agents", path: "/htt/agents", icon: UsersIcon },
  { name: "Companies", path: "/htt/companies", icon: BuildingOffice2Icon },
  { name: "Renewals", path: "/htt/renewals", icon: ArrowPathIcon },
  { name: "Payments", path: "/htt/payments", icon: BanknotesIcon },
  { name: "Agent Inquiries", path: "/htt/agent-inquiries", icon: EnvelopeIcon },
  { name: "Guest Messages", path: "/htt/guest-messages", icon: EnvelopeIcon },
  { name: "Users", path: "/htt/users", icon: UserGroupIcon },
  { name: "Notifications", path: "/htt/notifications", icon: BellIcon },
  { name: "Reports", path: "/htt/reports", icon: ChartBarSquareIcon },
  { name: "Audit Log", path: "/htt/audit", icon: ClipboardDocumentListIcon },
  { name: "Settings", path: "/htt/settings", icon: Cog6ToothIcon },
  { name: "Support", path: "/htt/support", icon: LifebuoyIcon },
];

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const [unreadGuestCount, setUnreadGuestCount] = useState(0);
  const [usersBadgeCount, setUsersBadgeCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await API.get("/htt/inquiries");
        const unread = res.data.filter(i => !i.is_read).length;
        setUnreadGuestCount(unread);
      } catch (err) {
        // Silently fail if unable to fetch inquiries
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const SEEN_KEY = "admin_seen_user_ids";

    const getSeenIds = () => {
      try {
        return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
      } catch {
        return new Set();
      }
    };

    const computeBadge = (alertIds) => {
      const seen = getSeenIds();
      return alertIds.filter((id) => !seen.has(id)).length;
    };

    const fetchUsersBadge = async () => {
      try {
        const res = await API.get("/htt/users/pending-count");
        const alertIds = res.data?.alert_user_ids || [];
        setUsersBadgeCount(computeBadge(alertIds));
      } catch {
        // silently fail
      }
    };

    fetchUsersBadge();
    const interval = setInterval(fetchUsersBadge, 30000);

    const handleUserViewed = (e) => {
      const userId = e.detail?.userId;
      if (!userId) return;
      const seen = getSeenIds();
      seen.add(userId);
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
      setUsersBadgeCount((prev) => Math.max(0, prev - 1));
    };

    window.addEventListener("userViewed", handleUserViewed);
    return () => {
      clearInterval(interval);
      window.removeEventListener("userViewed", handleUserViewed);
    };
  }, []);

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
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card-light dark:bg-card-dark border-r border-border-light dark:border-border-dark flex flex-col transform transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border-light dark:border-border-dark">
          <span className="text-xl font-bold text-primary-light dark:text-primary-dark">
            <Link to="/htt/dashboard">BeemaSathi</Link>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-hover-light dark:hover:bg-hover-dark md:hidden"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-hidden text-text-light dark:text-text-dark">
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
                    : "text-muted-light dark:text-muted-dark hover:bg-hover-light dark:hover:bg-hover-dark"
                }
              `
              }
            >
              <div className="flex items-center gap-3 flex-1">
                <item.icon className="w-5 h-5" />
                {item.name}
              </div>
              {item.name === "Guest Messages" && unreadGuestCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                  {unreadGuestCount}
                </span>
              )}
              {item.name === "Users" && usersBadgeCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                  {usersBadgeCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
