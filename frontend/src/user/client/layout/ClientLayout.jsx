import React, { useState } from "react";
import ChatBubble from "../components/ChatBubble";
import ClientSidebar from "./ClientSidebar";
import Footer from "../../../components/Footer";

const ClientLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="
        flex min-h-screen
        bg-background-light dark:bg-background-dark
        text-text-light dark:text-text-dark
        transition-colors duration-300
      "
    >
      {/* Sidebar */}
      <ClientSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        setCollapsed={setCollapsed}
      />
      {/* Main content wrapper */}
      <div
        className={`
          flex-1 transition-all duration-300
          ${collapsed ? "md:ml-20" : "md:ml-64"}
        `}
      >
        {/* Page Container */}
        <div className="p-4 md:p-8">
          <div
            className="
              rounded-2xl 
              border border-border-light dark:border-border-dark
              bg-card-light dark:bg-card-dark
              backdrop-blur
              shadow-sm
              p-4 md:p-6
              transition-colors duration-300
            "
          >
            {children}
          </div>
          <Footer />
        </div>
      </div>
      <ChatBubble />
    </div>
  );
};

export default ClientLayout;
