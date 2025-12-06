import { useState } from "react";

import { Sidebar } from "@/components/sidebar";

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();

  const handleNewChat = () => {
    console.log("New chat clicked");
    // Handle new chat logic here
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    console.log("Chat selected:", chatId);
    // Handle chat selection logic here
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar onNewChat={handleNewChat} onChatSelect={handleChatSelect} />
      <div className="flex-1 flex items-center justify-center bg-default-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-default-600 mb-2">
            {selectedChatId
              ? `Chat ${selectedChatId} được chọn`
              : "Chọn một cuộc trò chuyện để bắt đầu"}
          </h2>
          <p className="text-default-500">
            Nội dung chat sẽ hiển thị ở đây
          </p>
        </div>
      </div>
    </div>
  );
}

