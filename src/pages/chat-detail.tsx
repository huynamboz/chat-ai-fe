import type { ReceiveAnswerResponse } from "@/types/api.types";

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronDown, Loader } from "lucide-react";
import { ScrollShadow } from "@heroui/scroll-shadow";

import { Sidebar } from "@/components/sidebar";
import { ChatInput } from "@/components/chat-input";
import { ChatMessageItem } from "@/components/chat-message-item";
import { useChatStore } from "@/stores/chat.store";
import { useWebSocket } from "@/hooks/use-websocket";
import { useWebSocketStore } from "@/stores/websocket.store";
import { useAuth } from "@/contexts/auth.context";
import { webSocketService } from "@/services/websocket.service";
import { useConversations } from "@/hooks/use-conversations";

export default function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isConnected, askQuestion } = useWebSocket();
  const currentReport = useWebSocketStore((state) => state.currentReport);
  const processMessages = useWebSocketStore((state) => state.processMessages);
  const thinkingTimeMap = useWebSocketStore((state) => state.thinkingTimeMap);
  const {
    selectChatSession,
    getMessagesBySession,
    getSelectedSession,
    addMessage,
  } = useChatStore();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayText, setDisplayText] = useState<string>("");
  const [isProcessExpanded, setIsProcessExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations and messages
  const { loadMessagesForSession } = useConversations();
  const selectedChatSessionId = useChatStore(
    (state) => state.selectedChatSessionId,
  );

  // Select chat session when component mounts and load messages
  useEffect(() => {
    if (id && selectedChatSessionId !== id) {
      selectChatSession(id);
    }
  }, [id, selectedChatSessionId, selectChatSession]);

  // Load messages when session changes
  useEffect(() => {
    if (id) {
      loadMessagesForSession(id);
    }
  }, [id]);

  const selectedSession = getSelectedSession();
  const messages = id ? getMessagesBySession(id) : [];

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

  const handleNewChat = () => {
    navigate("/");
  };

  const handleChatSelect = (chatId: string) => {
    navigate(`/chats/${chatId}`);
  };

  const handleSend = async () => {
    const question = message.trim();

    if (!question || !isConnected || isLoading || !id) return;

    // Reset report and process messages when starting new question
    useWebSocketStore.getState().clearProcessMessages();
    setIsProcessExpanded(false);

    // Add user message to store immediately
    const userMessage = {
      _id: `temp_user_${Date.now()}`,
      chatSessionId: id,
      role: "user" as const,
      content: question,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addMessage(id, userMessage);
    setMessage("");
    setIsLoading(true);
    scrollToBottom();

    try {
      // Send question via WebSocket with session ID
      askQuestion(question, id);
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsLoading(false);
    }
  };

  // Listen to WebSocket events for loading state only
  // Messages are handled by use-websocket.ts hook
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const handleServerAck = () => {
      setIsLoading(true);
    };

    const handleReceiveAnswer = (data: ReceiveAnswerResponse) => {
      // Only update loading state if it's for current session
      if (data.chatSessionId === id) {
        setIsLoading(false);
        scrollToBottom();
      }
    };

    const handleServerReport = () => {
      // Report is handled by store, just ensure loading state
      if (!isLoading) {
        setIsLoading(true);
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
  }, [isAuthenticated, id]);

  return (
    <div className="flex h-screen w-full bg-white">
      <Sidebar onChatSelect={handleChatSelect} onNewChat={handleNewChat} />
      <div className="bg-slate-50/50 border border-slate-200 shadow-sm px-8 pt-5 flex flex-1 flex-col">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900">
              AKE Intelligence
            </h1>
            <span className="inline-flex items-center rounded-full bg-[#1d844b] text-white text-[11px] px-2 py-0.5">
              Plus
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 transition"
              type="button"
            >
              active
            </button>
            <button
              className="px-4 cursor-pointer flex items-center gap-2 py-1.5 rounded-full bg-[#1d844b] text-white text-xs font-medium hover:bg-slate-800 transition"
              type="button"
              onClick={handleNewChat}
            >
              <svg
                height="16"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M15.635 2.124c.327-.832 1.503-.832 1.83 0l.428 1.09l1.084.429c.83.328.83 1.504 0 1.832l-1.084.43l-.428 1.089c-.327.832-1.503.832-1.83 0l-.428-1.09l-1.085-.429c-.83-.328-.83-1.504 0-1.832l1.085-.43zm.915.406l.415 1.055c.1.254.3.455.553.556l1.057.418l-1.057.419a.98.98 0 0 0-.553.555l-.415 1.055l-.415-1.055a.98.98 0 0 0-.554-.555l-1.057-.419l1.057-.418a.98.98 0 0 0 .554-.556zm-13.236.784a3.633 3.633 0 0 1 5.139 0l12.233 12.233a3.633 3.633 0 0 1-5.139 5.139L3.314 8.453a3.633 3.633 0 0 1 0-5.139m4.078 1.06a2.133 2.133 0 1 0-3.017 3.018L5.96 8.978l3.017-3.017zm9.216 15.251L7.022 10.04l3.017-3.017l9.586 9.586a2.133 2.133 0 1 1-3.017 3.017m4.724-10.679c-.327-.833-1.503-.833-1.83 0l-.155.393l-.391.155c-.83.328-.83 1.504 0 1.832l.391.155l.155.394c.327.832 1.503.832 1.83 0l.154-.394l.392-.155c.83-.328.83-1.504 0-1.832l-.392-.155zm-.915.405l-.141.36c-.1.253-.3.455-.554.555l-.364.144l.364.144c.254.1.454.302.554.555l.14.36l.142-.36c.1-.253.3-.454.554-.555l.364-.144l-.364-.144a.98.98 0 0 1-.554-.555zM4.668 15.124c.327-.832 1.503-.832 1.83 0l.155.394l.39.154c.83.329.83 1.505 0 1.833l-.39.155l-.155.393c-.327.833-1.503.833-1.83 0l-.155-.393l-.391-.155c-.83-.328-.83-1.504 0-1.832l.391-.155zm.774.765l.14-.36l.142.36c.1.254.3.455.554.556l.364.144l-.364.144a.98.98 0 0 0-.554.555l-.141.36l-.141-.36a.98.98 0 0 0-.554-.555l-.364-.144l.364-.144a.98.98 0 0 0 .554-.556"
                  fill="currentColor"
                  fillRule="evenodd"
                />
              </svg>
              New Chat
            </button>
          </div>
        </header>
        {/* Main Content Area */}
        <ScrollShadow
          hideScrollBar
          className="flex-1 flex flex-col overflow-y-auto"
        >
          {selectedSession ? (
            <ScrollShadow
              hideScrollBar
              className="flex-1 flex flex-col overflow-y-auto"
            >
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.length === 0 ? (
                  <ScrollShadow
                    hideScrollBar
                    className="flex-1 flex flex-col overflow-y-auto"
                  >
                    <div className="text-center text-gray-500 py-8">
                      No messages yet. Start the conversation!
                    </div>
                  </ScrollShadow>
                ) : (
                  messages.map((message) => {
                    const thinkingTime =
                      message.role === "bot"
                        ? thinkingTimeMap[message._id]
                        : undefined;

                    const thinkingTimeText =
                      thinkingTime !== undefined
                        ? formatThinkingTime(thinkingTime)
                        : undefined;

                    return (
                      <ChatMessageItem
                        key={message._id}
                        message={message}
                        thinkingTimeText={thinkingTimeText}
                      />
                    );
                  })
                )}
                {isLoading && (
                  <div className="flex flex-col justify-start gap-2">
                    <div className="rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex flex-col gap-1 flex-1">
                            <div className="text-sm italic font-medium relative inline-block">
                              <span
                                className="bg-gradient-to-r from-gray-700 from-0% via-gray-300 via-50% to-gray-700 to-100% bg-[length:200%_100%] bg-clip-text text-transparent animate-skeleton"
                                style={{
                                  WebkitBackgroundClip: "text",
                                }}
                              >
                                Thinking...
                              </span>
                            </div>
                            {displayText && displayText !== "Thinking..." && (
                              <div className="flex items-center gap-2">
                                <Loader className="w-4 h-4 text-gray-500 animate-spin flex-shrink-0" />
                                <div
                                  key={displayText}
                                  className="text-xs text-gray-500 animate-fade-in"
                                >
                                  {displayText}
                                </div>
                                {processMessages.length > 0 && (
                                  <button
                                    aria-label={
                                      isProcessExpanded ? "Collapse" : "Expand"
                                    }
                                    className="flex items-center justify-center p-1 rounded hover:bg-gray-200 transition-colors"
                                    type="button"
                                    onClick={() =>
                                      setIsProcessExpanded(!isProcessExpanded)
                                    }
                                  >
                                    <ChevronDown
                                      className={`w-4 h-4 text-gray-500 transition-transform duration-300 ease-in-out ${
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
                        className={`bg-gray-50 rounded-lg px-4 border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
                          isProcessExpanded
                            ? "max-h-96 opacity-100 py-3"
                            : "max-h-0 opacity-0 py-0"
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-600 mb-2">
                          Process Log:
                        </div>
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                          {processMessages.map((process, index) => {
                            const duration = getProcessDuration(index);

                            return (
                              <div
                                key={process.id}
                                className="flex items-start gap-2 text-xs text-gray-600"
                              >
                                <span className="text-gray-400 flex-shrink-0">
                                  {index + 1}.
                                </span>
                                <span className="flex-1">
                                  {process.message}
                                  {duration !== null && (
                                    <span className="ml-2 text-gray-500">
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
            </ScrollShadow>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-2xl px-4">
                <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                  Chat not found
                </h2>
                <p className="text-gray-500">
                  The chat session you&apos;re looking for doesn&apos;t exist.
                </p>
              </div>
            </div>
          )}
        </ScrollShadow>

        {/* Input Area - Only show if session exists */}
        {selectedSession && (
          <div className="p-4 pt-0">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                isConnected={isConnected}
                isLoading={isLoading}
                message={message}
                onMessageChange={(value) => setMessage(value)}
                onSend={handleSend}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
