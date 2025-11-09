import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { Sidebar } from "@/components/sidebar";
import { SendIcon } from "@/components/icons";

export default function IndexPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const navigate = useNavigate();

  const handleNewChat = () => {
    console.log("New chat clicked");
    setSelectedChatId(undefined);
    // Handle new chat logic here
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    navigate(`/chats/${chatId}`);
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-950">
      <Sidebar
        onNewChat={handleNewChat}
        onChatSelect={handleChatSelect}
        selectedChatId={selectedChatId}
      />
      <div className="flex-1 flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-2xl px-4">
            <h1 className="text-4xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              How can I help you today?
            </h1>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2">
              <Input
                aria-label="Message input"
                classNames={{
                  base: "flex-1",
                  inputWrapper: "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-lg",
                  input: "text-base py-4",
                }}
                placeholder="Message..."
                variant="bordered"
              />
              <Button
                className="min-w-10 h-10 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                isIconOnly
              >
                <SendIcon className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              ChatGPT can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
