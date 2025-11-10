/**
 * WebSocket Provider
 * Manages WebSocket connection lifecycle
 */

import { useWebSocket } from "@/hooks/use-websocket";

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  // Initialize WebSocket connection
  useWebSocket();

  return <>{children}</>;
}

