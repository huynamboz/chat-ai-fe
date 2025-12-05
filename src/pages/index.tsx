import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { Sidebar } from "@/components/sidebar";
import { SendIcon } from "@/components/icons";
import { MessageContent } from "@/components/message-content";
import { useWebSocket } from "@/hooks/use-websocket";
import { useChatStore } from "@/stores/chat.store";
import { useAuth } from "@/contexts/auth.context";
import { webSocketService } from "@/services/websocket.service";
import type { ReceiveAnswerResponse } from "@/types/api.types";

export default function IndexPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isConnected, askQuestion } = useWebSocket();
  const { addMessage, addChatSession, selectChatSession, getMessagesBySession } = useChatStore();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages for current session (reactive)
  const messages = currentSessionId
    ? getMessagesBySession(currentSessionId)
    : [];

  const handleNewChat = () => {
    setCurrentSessionId(null);
    selectChatSession(null);
    navigate("/");
  };

  const handleChatSelect = (chatId: string) => {
    navigate(`/chats/${chatId}`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    const question = message.trim();
    if (!question || !isConnected || isLoading) return;

    // Add user message to store immediately (will be replaced by server response)
    const userMessage = {
      _id: `temp_user_${Date.now()}`,
      chatSessionId: currentSessionId || "",
      role: "user" as const,
      content: question,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store user message temporarily (will be replaced when server responds)
    if (!currentSessionId) {
      // For new chat, we'll add it after session is created
    } else {
      addMessage(currentSessionId, userMessage);
      scrollToBottom();
    }

    setMessage("");
    setIsLoading(true);

    try {
      // Send question via WebSocket
      askQuestion(question, currentSessionId || undefined);
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Listen to WebSocket events for navigation and loading state
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleServerAck = () => {
      setIsLoading(true);
    };

    const handleReceiveAnswer = (data: ReceiveAnswerResponse) => {
      setIsLoading(false);

      // Navigate to chat detail page if new session created
      if (data.chatSessionId) {
        const state = useChatStore.getState();
        const sessionExists = state.chatSessions.some(
          (s) => s._id === data.chatSessionId
        );

        if (!sessionExists) {
          // Navigate to chat detail page when new session is created
          navigate(`/chats/${data.chatSessionId}`);
          setCurrentSessionId(data.chatSessionId);
        } else {
          setCurrentSessionId(data.chatSessionId);
        }

        scrollToBottom();
      }
    };

    const handleErrorMessage = (data: { message: string }) => {
      setIsLoading(false);
      console.error("WebSocket error:", data.message);
    };

    webSocketService.onServerAck(handleServerAck);
    webSocketService.onReceiveAnswer(handleReceiveAnswer);
    webSocketService.onErrorMessage(handleErrorMessage);

    return () => {
      webSocketService.offServerAck(handleServerAck);
      webSocketService.offReceiveAnswer(handleReceiveAnswer);
      webSocketService.offErrorMessage(handleErrorMessage);
    };
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-950">
      <Sidebar onNewChat={handleNewChat} onChatSelect={handleChatSelect} />
      <div className="flex-1 flex flex-col">
        {/* Main Content Area */}
        {currentSessionId && messages.length > 0 ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-gray-900 dark:bg-gray-800 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <MessageContent
                        className={
                          msg.role === "user"
                            ? "text-white prose-invert"
                            : "text-gray-900"
                        }
                        content={msg.content}
                      />
                      <div
                        className={`text-xs mt-1 ${
                          msg.role === "user"
                            ? "text-gray-400"
                            : "text-gray-500"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-2xl px-4">
              <h1 className="text-4xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                How can I help you today?
              </h1>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2">
              <Input
                aria-label="Message input"
                classNames={{
                  base: "flex-1",
                  inputWrapper:
                    "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-lg",
                  input: "text-base py-4",
                }}
                placeholder="Message..."
                variant="bordered"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!isConnected || isLoading}
              />
              <Button
                className="min-w-10 h-10 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                isIconOnly
                onPress={handleSend}
                isDisabled={!isConnected || isLoading || !message.trim()}
              >
                <SendIcon className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Nhom1GPT can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
