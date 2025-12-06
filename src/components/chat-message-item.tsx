import type { ChatMessage } from "@/types/api.types";

import { MessageContent } from "@/components/message-content";

interface ChatMessageItemProps {
  message: ChatMessage;
  thinkingTimeText?: string;
}

export const ChatMessageItem = ({
  message,
  thinkingTimeText,
}: ChatMessageItemProps) => {
  const isUser = message.role === "user";

  return (
    <div className="space-y-1">
      {thinkingTimeText && (
        <div className="flex justify-start">
          <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
            {thinkingTimeText}
          </div>
        </div>
      )}
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[80%] rounded-3xl px-6 py-2 ${
            isUser ? "bg-[#eff1f3]" : ""
          }`}
        >
          <MessageContent
            className={isUser ? "text-white prose-invert" : "text-gray-900"}
            content={message.content}
          />
          <div
            className={`text-xs mt-1 ${
              isUser ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {new Date(message.createdAt).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};


