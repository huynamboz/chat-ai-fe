import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";

import {
  PlusIcon,
  SearchIcon,
  MenuIcon,
  SettingsIcon,
  UserIcon,
  LogoutIcon,
} from "@/components/icons";
import { useAuth } from "@/contexts/auth.context";
import { useChatStore } from "@/stores/chat.store";
import { useConversations } from "@/hooks/use-conversations";

interface SidebarProps {
  onNewChat?: () => void;
  onChatSelect?: (chatId: string) => void;
}

export const Sidebar = ({ onNewChat, onChatSelect }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Get chat sessions and selected session from store
  const { chatSessions, selectedChatSessionId, selectChatSession } =
    useChatStore();

  // Load conversations from API
  useConversations();

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

  return (
    <div className="flex flex-col h-full w-64 bg-gray-900 text-white">
      {/* Header with Menu and New Chat */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <MenuIcon className="w-5 h-5" />
          </button>
          <Button
            className="flex-1 bg-transparent border border-gray-700 hover:bg-gray-800 text-white justify-start"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleNewChat}
          >
            New chat
          </Button>
        </div>

        {/* Search Chat */}
        <Input
          aria-label="Search chat"
          classNames={{
            base: "w-full",
            inputWrapper: "bg-gray-800 border-gray-700 hover:bg-gray-800",
            input: "text-sm text-white placeholder:text-gray-500",
          }}
          placeholder="Search chat..."
          size="sm"
          startContent={
            <SearchIcon className="text-gray-400 pointer-events-none flex-shrink-0 w-4 h-4" />
          }
          type="search"
        />
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2">
          <div className="flex flex-col gap-1">
            {activeSessions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                No chats yet. Start a new conversation!
              </div>
            ) : (
              activeSessions.map((session) => (
                <button
                  key={session._id}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    selectedChatSessionId === session._id
                      ? "bg-gray-800"
                      : "hover:bg-gray-800/50"
                  }`}
                  onClick={() => handleChatSelect(session._id)}
                >
                  <div className="truncate">{session.title}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer with User Info and Settings */}
      <div className="p-3 border-t border-gray-800 space-y-2">
        {/* User Info */}
        {user && (
          <div className="px-3 py-2 rounded-lg bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-300">
                  {user.username?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate">
                  {user.username || "User"}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Dropdown */}
        <Dropdown
          classNames={{
            content: "bg-gray-800 border border-gray-700",
          }}
          placement="top-start"
        >
          <DropdownTrigger>
            <button className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              <SettingsIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-300">Settings</span>
            </button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Settings menu"
            itemClasses={{
              base: "text-gray-200 data-[hover=true]:bg-gray-700",
            }}
            onAction={(key) => {
              if (key === "profile") {
                // Navigate to profile page (you can create this later)
                // TODO: Navigate to profile page
              } else if (key === "logout") {
                logout();
              }
            }}
          >
            <DropdownItem
              key="profile"
              className="text-gray-200"
              startContent={<UserIcon className="w-4 h-4" />}
            >
              Profile
            </DropdownItem>
            <DropdownItem
              key="logout"
              className="text-red-400 data-[hover=true]:bg-red-900/20"
              startContent={<LogoutIcon className="w-4 h-4" />}
            >
              Logout
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
};
