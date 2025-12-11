import React from "react";
import { NavLink } from "react-router-dom";
const sidebarItems = [
  { name: "Dashboard", path: "/admin/dashboard" },
  { name: "Policies", path: "/admin/policies" },
  { name: "Agents", path: "/admin/agents" },
  { name: "Companies", path: "/admin/companies" },
  { name: "Clients", path: "/admin/clients" },
  { name: "Inquiries", path: "/admin/inquiries" },
  { name: "Buy Requests", path: "/admin/buy-requests" },
  { name: "KYC", path: "/admin/kyc" },
];

const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar">
      <ul>
        {sidebarItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive ? "active-link" : undefined
              }
            >
              {item.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default AdminSidebar;
