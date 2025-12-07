import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";

import { PlusIcon, DeleteIcon, EditIcon, LogoutIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/contexts/auth.context";
import { useChatStore } from "@/stores/chat.store";
import { useConversations } from "@/hooks/use-conversations";
import { chatSessionService } from "@/services/chat-session.service";

interface SidebarProps {
  onNewChat?: () => void;
  onChatSelect?: (chatId: string) => void;
}

export const Sidebar = ({ onNewChat, onChatSelect }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Get chat sessions and selected session from store
  const {
    chatSessions,
    selectedChatSessionId,
    selectChatSession,
    deleteChatSession,
    updateChatSession,
  } = useChatStore();

  // Load conversations from API
  useConversations();

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Filter out deleted sessions
  const activeSessions = chatSessions.filter((session) => !session.isDeleted);

  // Handle chat selection
  const handleChatSelect = (sessionId: string) => {
    selectChatSession(sessionId);
    onChatSelect?.(sessionId);
    navigate(`/chats/${sessionId}`);
  };

  // Handle new chat
  const handleNewChat = () => {
    selectChatSession(null);
    onNewChat?.();
    navigate("/");
  };

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent chat selection
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    try {
      // Call API to soft delete
      await chatSessionService.softDelete(sessionToDelete);

      // Update store
      deleteChatSession(sessionToDelete);

      // If deleted session is currently selected, navigate to home
      if (selectedChatSessionId === sessionToDelete) {
        selectChatSession(null);
        navigate("/");
      }

      // Show success toast
      addToast({
        title: "Deleted successfully",
        description: "Conversation has been deleted.",
        color: "success",
        severity: "success",
      });

      setSessionToDelete(null);
    } catch (error) {
      // Show error toast
      addToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete conversation. Please try again.",
        color: "danger",
        severity: "danger",
      });
    }
  };

  // Handle edit button click
  const handleEditClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent chat selection
    const session = chatSessions.find((s) => s._id === sessionId);

    if (session) {
      setEditingSessionId(sessionId);
      setEditTitle(session.title);
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingSessionId || !editTitle.trim()) {
      setEditingSessionId(null);
      setEditTitle("");

      return;
    }

    try {
      // Call API to update name
      const response = await chatSessionService.updateName(editingSessionId, {
        newTitle: editTitle.trim(),
      });

      // Update store
      updateChatSession(editingSessionId, {
        title: response.chatSession.title,
      });

      // Show success toast
      addToast({
        title: "Updated successfully",
        description: "Chat name has been updated.",
        color: "success",
        severity: "success",
      });

      setEditingSessionId(null);
      setEditTitle("");
    } catch (error) {
      // Show error toast
      addToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update chat name. Please try again.",
        color: "danger",
        severity: "danger",
      });
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditTitle("");
  };

  // Handle input key press
  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className="flex flex-col h-full w-64 bg-white p-4">
      {/* Logo + Title */}
      <div className="flex items-center gap-1 mb-4">
        <img src="https://devmock.dev/assets/images/logo.png" alt="" className="w-6 h-6" />
        <span className="text-lg font-semibold text-slate-900">AKE</span>
      </div>

      {/* New Chat button */}
      <button
        className="mb-6 w-full bg-gray-100 flex justify-center items-center px-5 cursor-pointer gap-2 hover:bg-gray-200 rounded-full py-2.5 text-sm font-medium transition"
        onClick={handleNewChat}
        type="button"
      >
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10">
          <PlusIcon className="w-3.5 h-3.5" />
        </span>
        <span>New Chat</span>
      </button>

      {/* Search conversations */}
      <div className="mb-4">
        <Input
          classNames={{
            base: "w-full",
            input: "text-sm",
            inputWrapper: "h-9 min-h-0 bg-slate-50 border-slate-200",
          }}
          placeholder="Search conversations"
          size="sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Saved static section */}
      {/* <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Saved
          </span>
        </div>

        {["ChatAI", "Image of sun", "Data Analyst"].map((item) => (
          <div
            key={item}
            className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[11px] text-slate-500">
                {item[0]}
              </span>
              <span className="truncate">{item}</span>
            </div>
            <button
              className="text-slate-400 hover:text-slate-600"
              type="button"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="currentColor"
              >
                <circle cx="4" cy="10" r="1.2" />
                <circle cx="10" cy="10" r="1.2" />
                <circle cx="16" cy="10" r="1.2" />
              </svg>
            </button>
          </div>
        ))}
      </div> */}

      {/* Dynamic chat sessions grouped by date */}
      <div className="space-y-4 flex-1 overflow-hidden">
        {(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const yesterdayStart = new Date(today);
          yesterdayStart.setDate(today.getDate() - 1);

          const normalizedSearch = searchTerm.trim().toLowerCase();

          const matchesSearch = (session: (typeof activeSessions)[number]) => {
            if (!normalizedSearch) return true;

            return session.title.toLowerCase().includes(normalizedSearch);
          };

          const todaySessions = activeSessions.filter((session) => {
            const created = new Date(session.createdAt);

            return created >= today && matchesSearch(session);
          });

          const yesterdaySessions = activeSessions.filter((session) => {
            const created = new Date(session.createdAt);

            return (
              created >= yesterdayStart &&
              created < today &&
              matchesSearch(session)
            );
          });

          const earlierSessions = activeSessions.filter((session) => {
            const created = new Date(session.createdAt);

            return created < yesterdayStart && matchesSearch(session);
          });

          const sections = [
            { key: "today", label: "Today", sessions: todaySessions },
            { key: "yesterday", label: "Yesterday", sessions: yesterdaySessions },
            { key: "earlier", label: "Earlier", sessions: earlierSessions },
          ].filter((section) => section.sessions.length > 0);

          if (sections.length === 0) {
            return (
              <div className="text-xs text-slate-400">
                No conversations yet. Start a new chat to see it here.
              </div>
            );
          }

          return sections.map((section) => (
            <div key={section.key}>
              <div className="flex items-center justify-between w-full text-xs text-slate-500 mb-1.5">
                <span className="font-medium">
                  {section.key === "earlier" ? "Earlier" : section.label}
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {section.sessions.map((session) => (
                  <div
                    key={session._id}
                    className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-sm cursor-pointer ${
                      selectedChatSessionId === session._id
                        ? "bg-gray-100"
                        : "hover:bg-slate-100 text-slate-800"
                    }`}
                    onClick={() => handleChatSelect(session._id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleChatSelect(session._id);
                      }
                    }}
                  >
                    {editingSessionId === session._id ? (
                      <Input
                        ref={editInputRef}
                        aria-label="Edit chat name"
                        classNames={{
                          base: "flex-1",
                          inputWrapper:
                            "bg-slate-100 border-slate-200 h-8 min-h-8",
                          input: "text-sm text-slate-900",
                        }}
                        size="sm"
                        value={editTitle}
                        onBlur={handleSaveEdit}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleEditKeyPress}
                      />
                    ) : (
                      <>
                        <button
                          className="flex-1 text-left truncate"
                          type="button"
                        >
                          <div className="truncate">{session.title}</div>
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            aria-label="Edit chat name"
                            className="p-1 hover:bg-slate-200 rounded"
                            type="button"
                            onClick={(e) => handleEditClick(e, session._id)}
                          >
                            <EditIcon className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                          </button>
                          <button
                            aria-label="Delete conversation"
                            className="p-1 hover:bg-slate-200 rounded"
                            type="button"
                            onClick={(e) => handleDeleteClick(e, session._id)}
                          >
                            <DeleteIcon className="w-4 h-4 text-slate-400 hover:text-red-500" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Footer: user info + logout */}
      {user && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Profile"
              className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0 hover:opacity-90 transition"
              onClick={() => navigate("/profile")}
            >
              {user.username?.charAt(0).toUpperCase() ||
                user.email?.charAt(0).toUpperCase() ||
                "S"}
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-slate-900 truncate">
                {user.username || "User"}
              </span>
              <span className="text-[11px] text-slate-500 truncate">
                {user.email}
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Log out"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 transition"
            onClick={() => setLogoutDialogOpen(true)}
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        cancelText="Cancel"
        confirmColor="danger"
        confirmText="Delete"
        isOpen={deleteDialogOpen}
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        title="Delete Conversation"
        onClose={() => {
          setDeleteDialogOpen(false);
          setSessionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        cancelText="Cancel"
        confirmColor="danger"
        confirmText="Log out"
        isOpen={logoutDialogOpen}
        message="Are you sure you want to log out of your account?"
        title="Log out"
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={() => {
          setLogoutDialogOpen(false);
          logout();
          navigate("/login");
        }}
      />
    </div>
  );
};
