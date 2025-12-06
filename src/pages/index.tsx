import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { ChevronDown, Loader } from "lucide-react";

import { Sidebar } from "@/components/sidebar";
import { SendIcon } from "@/components/icons";
import { MessageContent } from "@/components/message-content";
import { useWebSocket } from "@/hooks/use-websocket";
import { useChatStore } from "@/stores/chat.store";
import { useWebSocketStore } from "@/stores/websocket.store";
import { useAuth } from "@/contexts/auth.context";
import { webSocketService } from "@/services/websocket.service";
import type { ReceiveAnswerResponse } from "@/types/api.types";

export default function IndexPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isConnected, askQuestion } = useWebSocket();
  const { addMessage, addChatSession, selectChatSession, getMessagesBySession } = useChatStore();
  const currentReport = useWebSocketStore((state) => state.currentReport);
  const processMessages = useWebSocketStore((state) => state.processMessages);
  const thinkingTimeMap = useWebSocketStore((state) => state.thinkingTimeMap);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayText, setDisplayText] = useState<string>("");
  const [isProcessExpanded, setIsProcessExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages for current session (reactive)
  const messages = currentSessionId
    ? getMessagesBySession(currentSessionId)
    : [];

  // Update current time for real-time duration calculation
  useEffect(() => {
    if (isLoading && processMessages.length > 0) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 100); // Update every 100ms for smooth animation

      return () => clearInterval(interval);
    }
  }, [isLoading, processMessages.length]);

  // Calculate duration for each process message
  const getProcessDuration = (index: number): number | null => {
    if (index >= processMessages.length - 1) {
      // For the last message, calculate from its timestamp to now (if still loading)
      if (isLoading) {
        return currentTime - processMessages[index].timestamp;
      }

      return null;
    }

    // Calculate duration from current message to next message
    return (
      processMessages[index + 1].timestamp - processMessages[index].timestamp
    );
  };

  // Format duration in seconds
  const formatDuration = (ms: number): string => {
    const seconds = (ms / 1000).toFixed(1);

    return `${seconds}s`;
  };

  // Format thinking time for display
  const formatThinkingTime = (ms: number): string => {
    const seconds = Math.round(ms / 1000);

    return `Thought for ${seconds}s`;
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    selectChatSession(null);
    useWebSocketStore.getState().clearProcessMessages();
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

  // Update display text with fade effect when currentReport changes
  useEffect(() => {
    if (currentReport) {
      // Update display text directly - animation will handle fade
      setDisplayText(currentReport);
    } else {
      setDisplayText("");
    }
  }, [currentReport]);

  const handleSend = async () => {
    const question = message.trim();
    if (!question || !isConnected || isLoading) return;

    // Reset report and process messages when starting new question
    useWebSocketStore.getState().clearProcessMessages();
    setIsProcessExpanded(false);

    // Create a temporary session ID if we don't have one yet
    const tempSessionId = currentSessionId || `temp_session_${Date.now()}`;

    // Add user message to store immediately
    const userMessage = {
      _id: `temp_user_${Date.now()}`,
      chatSessionId: tempSessionId,
      role: "user" as const,
      content: question,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add message to store (will be replaced by server response)
    if (!currentSessionId) {
      // For new chat, create a temporary session in store
      const state = useChatStore.getState();
      useChatStore.setState({
        messages: {
          ...state.messages,
          [tempSessionId]: [userMessage],
        },
      });
      setCurrentSessionId(tempSessionId);
    } else {
      addMessage(currentSessionId, userMessage);
    }

    setMessage("");
    setIsLoading(true);
    scrollToBottom();

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

    const handleServerReport = () => {
      // Report is handled by store, just ensure loading state
      if (!isLoading) {
        setIsLoading(true);
      }
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
    webSocketService.onServerReport(handleServerReport);
    webSocketService.onReceiveAnswer(handleReceiveAnswer);
    webSocketService.onErrorMessage(handleErrorMessage);

    return () => {
      webSocketService.offServerAck(handleServerAck);
      webSocketService.offServerReport(handleServerReport);
      webSocketService.offReceiveAnswer(handleReceiveAnswer);
      webSocketService.offErrorMessage(handleErrorMessage);
    };
  }, [isAuthenticated, navigate, isLoading]);

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-950">
      <Sidebar onNewChat={handleNewChat} onChatSelect={handleChatSelect} />
      <div className="flex-1 flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {currentSessionId && messages.length > 0 ? (
            <div className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((message) => {
                  const thinkingTime =
                    message.role === "bot"
                      ? thinkingTimeMap[message._id]
                      : undefined;

                  return (
                    <div key={message._id} className="space-y-1">
                      {thinkingTime !== undefined && (
                        <div className="flex justify-start">
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                            {formatThinkingTime(thinkingTime)}
                          </div>
                        </div>
                      )}
                      <div
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.role === "user"
                              ? "bg-gray-900 dark:bg-gray-800 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          <MessageContent
                            className={
                              message.role === "user"
                                ? "text-white prose-invert"
                                : "text-gray-900"
                            }
                            content={message.content}
                          />
                          <div
                            className={`text-xs mt-1 ${
                              message.role === "user"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex flex-col justify-start gap-2">
                    <div className="rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex flex-col gap-1 flex-1">
                            <div className="text-sm italic font-medium relative inline-block">
                              <span
                                className="bg-gradient-to-r from-gray-700 from-0% via-gray-300 via-50% to-gray-700 to-100% dark:from-gray-200 dark:via-gray-400 dark:to-gray-200 bg-[length:200%_100%] bg-clip-text text-transparent animate-skeleton"
                                style={{
                                  WebkitBackgroundClip: "text",
                                }}
                              >
                                Thinking...
                              </span>
                            </div>
                            {displayText && displayText !== "Thinking..." && (
                              <div className="flex items-center gap-2">
                                <Loader className="w-4 h-4 text-gray-500 dark:text-gray-400 animate-spin flex-shrink-0" />
                                <div
                                  key={displayText}
                                  className="text-xs text-gray-500 dark:text-gray-400 animate-fade-in"
                                >
                                  {displayText}
                                </div>
                                {processMessages.length > 0 && (
                                  <button
                                    aria-label={
                                      isProcessExpanded
                                        ? "Collapse"
                                        : "Expand"
                                    }
                                    className="flex items-center justify-center p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    type="button"
                                    onClick={() =>
                                      setIsProcessExpanded(!isProcessExpanded)
                                    }
                                  >
                                    <ChevronDown
                                      className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-in-out ${
                                        isProcessExpanded ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {processMessages.length > 0 && (
                      <div
                        className={`bg-gray-50 dark:bg-gray-900 rounded-lg px-4 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ease-in-out ${
                          isProcessExpanded
                            ? "max-h-96 opacity-100 py-3"
                            : "max-h-0 opacity-0 py-0"
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Process Log:
                        </div>
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                          {processMessages.map((process, index) => {
                            const duration = getProcessDuration(index);

                            return (
                              <div
                                key={process.id}
                                className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400"
                              >
                                <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">
                                  {index + 1}.
                                </span>
                                <span className="flex-1">
                                  {process.message}
                                  {duration !== null && (
                                    <span className="ml-2 text-gray-500 dark:text-gray-500">
                                      ({formatDuration(duration)})
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
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
        </div>

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
