import type React from "react";

import { Textarea } from "@heroui/input";

import { SendIcon } from "@/components/icons";

interface ChatInputProps {
  message: string;
  isLoading: boolean;
  isConnected: boolean;
  onMessageChange: (value: string) => void;
  onSend: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  message,
  isLoading,
  isConnected,
  onMessageChange,
  onSend,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (!isConnected || isLoading || !message.trim()) return;

      onSend();
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md px-6 py-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Textarea
            className="flex-1 custom-textarea !bg-transparent border-0 outline-none resize-none text-sm text-slate-800 placeholder:text-slate-400 min-h-[40px] max-h-28"
            disabled={!isConnected || isLoading}
            maxRows={5}
            minRows={1}
            placeholder="Enter your question here..."
            value={message}
            onValueChange={onMessageChange}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <div className="flex items-end gap-2">
            <button
              className="flex items-center gap-1.5 rounded-full bg-[#1d844b] px-4 py-1.5 text-xs font-medium text-white hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!isConnected || isLoading || !message.trim()}
              type="button"
              onClick={onSend}
            >
              <span>Send</span>
              <SendIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-400 text-center">
        Centra may display inaccurate info, so please double check the response.{" "}
      </p>
    </>
  );
};
