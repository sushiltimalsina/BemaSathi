import React from "react";
import { useNavigate } from "react-router-dom";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";

const ChatBubble = () => {
  const navigate = useNavigate();

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
    </button>
  );
};

export default ChatBubble;
