import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { PlusIcon, SearchIcon, MenuIcon, SettingsIcon } from "@/components/icons";

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp?: string;
}

interface SidebarProps {
  chats?: Chat[];
  onNewChat?: () => void;
  onChatSelect?: (chatId: string) => void;
  selectedChatId?: string;
}

export const Sidebar = ({
  chats = [],
  onNewChat,
  onChatSelect,
  selectedChatId,
}: SidebarProps) => {
  // Sample chats data for UI demonstration
  const sampleChats: Chat[] = chats.length > 0 ? chats : [
    { id: "1", title: "Chat với bạn bè" },
    { id: "2", title: "Nhóm dự án" },
    { id: "3", title: "Gia đình" },
    { id: "4", title: "Đồng nghiệp" },
    { id: "5", title: "Bạn học cũ" },
    { id: "6", title: "Học tiếng Anh" },
    { id: "7", title: "Thảo luận công việc" },
    { id: "8", title: "Kế hoạch cuối tuần" },
  ];

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
            onPress={onNewChat}
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
          startContent={
            <SearchIcon className="text-gray-400 pointer-events-none flex-shrink-0 w-4 h-4" />
          }
          type="search"
          size="sm"
        />
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2">
          <div className="flex flex-col gap-1">
            {sampleChats.map((chat) => (
              <button
                key={chat.id}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  selectedChatId === chat.id
                    ? "bg-gray-800"
                    : "hover:bg-gray-800/50"
                }`}
                onClick={() => onChatSelect?.(chat.id)}
              >
                <div className="truncate">{chat.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer with Settings */}
      <div className="p-3 border-t border-gray-800">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          <SettingsIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-300">Settings</span>
        </button>
      </div>
    </div>
  );
};
