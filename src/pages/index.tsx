import type { ReceiveAnswerResponse } from "@/types/api.types";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Loader } from "lucide-react";

import { Sidebar } from "@/components/sidebar";
import { ChatInput } from "@/components/chat-input";
import { ChatMessageItem } from "@/components/chat-message-item";
import { useWebSocket } from "@/hooks/use-websocket";
import { useChatStore } from "@/stores/chat.store";
import { useWebSocketStore } from "@/stores/websocket.store";
import { useAuth } from "@/contexts/auth.context";
import { webSocketService } from "@/services/websocket.service";

export default function IndexPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isConnected, askQuestion } = useWebSocket();
  const {
    addMessage,
    addChatSession,
    selectChatSession,
    getMessagesBySession,
  } = useChatStore();
  const currentReport = useWebSocketStore((state) => state.currentReport);
  const processMessages = useWebSocketStore((state) => state.processMessages);
  const thinkingTimeMap = useWebSocketStore((state) => state.thinkingTimeMap);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayText, setDisplayText] = useState<string>("");
  const [isProcessExpanded, setIsProcessExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
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

  // Promotion questions for new chat hero section
  const promoQuestions = [
    "Which drugs are commonly used to treat lung cancer?",
    "What are the common symptoms of diarrhea?",
    "What are the typical symptoms of influenza (the flu)?",
  ];

  const suggestedPrompt =
    "Which medications are usually prescribed to treat the common cold?";

  const promoCards = [
    { question: promoQuestions[0], icon: "🧬" },
    { question: promoQuestions[1], icon: "💊" },
    { question: promoQuestions[2], icon: "🩺" },
    { question: suggestedPrompt, icon: "📊" },
  ];

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

  const sendQuestion = async (rawQuestion: string) => {
    const question = rawQuestion.trim();

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

  const handleSend = () => {
    void sendQuestion(message);
  };

  const handlePromoClick = (question: string) => {
    // Show the question in input then send it
    setMessage(question);
    void sendQuestion(question);
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
          (s) => s._id === data.chatSessionId,
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
    <div className="h-screen bg-slate-100 flex justify-center ">
      <div className="w-full flex">
        <Sidebar onChatSelect={handleChatSelect} onNewChat={handleNewChat} />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="flex-1 bg-white/60 border border-slate-200 shadow-sm px-8 pt-5 pb-5 flex flex-col h-screen">
            {/* Header */}
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
                {/* <button
                  className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 transition"
                  type="button"
                >
                  Configuration
                </button>
                <button
                  className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 transition"
                  type="button"
                >
                  Share
                </button> */}
                {/* <button
                  className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition"
                  type="button"
                  onClick={handleNewChat}
                >
                  New Chat
                </button> */}
              </div>
            </header>

            {/* Messages / content area */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              {currentSessionId && messages.length > 0 ? (
                <div className="flex-1 pb-6">
                  <div className="max-w-3xl mx-auto space-y-4">
                    {messages.map((message) => {
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
                    })}
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
                                {displayText &&
                                  displayText !== "Thinking..." && (
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
                                            isProcessExpanded
                                              ? "Collapse"
                                              : "Expand"
                                          }
                                          className="flex items-center justify-center p-1 rounded hover:bg-gray-200 transition-colors"
                                          type="button"
                                          onClick={() =>
                                            setIsProcessExpanded(
                                              !isProcessExpanded,
                                            )
                                          }
                                        >
                                          <ChevronDown
                                            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ease-in-out ${
                                              isProcessExpanded
                                                ? "rotate-180"
                                                : ""
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
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  {/* Hero greeting */}
                  <div className="flex flex-col items-center text-center px-4 mb-10">
                    <div className="mb-6 h-20 w-20 rounded-full bg-gradient-to-b from-sky-300 to-sky-500 shadow-md" />
                    <h2 className="text-4xl font-semibold tracking-tight text-slate-900 mb-2">
                      Hi, there <span className="align-middle">👋</span>
                    </h2>
                    <p className="text-sm text-slate-500 max-w-xl">
                      Tell us what you need about diseases, symptoms, or
                      medications, and we&apos;ll explore the Spoke knowledge
                      graph for you.
                    </p>
                  </div>

                  {/* Promo cards */}
                  <div className="w-full max-w-5xl px-4 pb-10">
                    <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Get started with an example below
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {promoCards.map((card) => (
                        <button
                          key={card.question}
                          className="group flex h-full flex-col justify-between rounded-3xl bg-white cursor-pointer px-5 py-4 text-left shadow-sm border border-slate-100 hover:border-sky-200 hover:bg-sky-50 hover:shadow-md transition"
                          type="button"
                          onClick={() => handlePromoClick(card.question)}
                        >
                          <p className="text-sm text-slate-800 leading-relaxed">
                            {card.question}
                          </p>
                          <span className="mt-6 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-base shadow-sm border border-slate-200 text-slate-600 group-hover:text-sky-600">
                            {card.icon}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat input capsule */}
            <div className="mt-6 flex justify-center">
              <div className="w-full max-w-2xl">
                <ChatInput
                  isConnected={isConnected}
                  isLoading={isLoading}
                  message={message}
                  onMessageChange={(value) => setMessage(value)}
                  onSend={handleSend}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
