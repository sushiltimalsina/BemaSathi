import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import API from "../../../api/api";

const ChatBubble = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = async () => {
    try {
      const res = await API.get("/support/unread-count");
      setUnreadCount(Number(res.data?.count) || 0);
    } catch (e) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 10000);
    const handleRefresh = () => loadUnread();
    window.addEventListener("support:client-refresh", handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("support:client-refresh", handleRefresh);
    };
  }, []);

  return (
    <button
      onClick={() => navigate("/client/support")}
      className="
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full shadow-xl
        bg-primary-light hover:bg-primary-dark
        text-white flex items-center justify-center
        transition-all duration-300
        hover:scale-105
      "
    >
      <ChatBubbleLeftRightIcon className="w-7 h-7" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-semibold flex items-center justify-center shadow">
          {unreadCount}
        </span>
      )}
    </button>
  );
};

export default ChatBubble;
