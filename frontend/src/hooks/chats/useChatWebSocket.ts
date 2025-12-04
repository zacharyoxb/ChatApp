import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  MessageTypeMap,
  WebSocketMessage,
  WSChatMessageData,
  WSUserAddedData,
  //WSUserRemovedData,
} from "../../types/chats";

/**
 * Custom hook for managing WebSocket connection as a singleton
 */
export const useChatWebSocket = () => {
  const websocketQuery = useQuery({
    queryKey: ["websocket"],
    queryFn: () => {
      return new Promise<WebSocket>((resolve, reject) => {
        const ws = new WebSocket("wss://localhost:8000/ws/chats");

        ws.onopen = () => {
          console.log("WebSocket connected.");
          resolve(ws);
        };

        ws.onerror = (error) => {
          console.error("WebSocket connection error:", error);
          reject(error);
        };
      });
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Establishes WebSocket connection for real-time chat updates
   * @param addMessageToChat - function that adds message to ChatDetails
   * @param updateLastMessage - function that updates the last message sent on ChatPreview
   * @param handleUserAddedToChat - function that handles the user being added to a chat
   */
  const connect = useCallback(
    (
      addMessageToChat: (messageData: WSChatMessageData) => void,
      updateLastMessage: (messageData: WSChatMessageData) => void,
      handleUserAddedToChat: (data: WSUserAddedData) => string
    ) => {
      const ws = websocketQuery.data;

      if (!ws) {
        console.warn("WebSocket not available");
        return;
      }

      ws.onmessage = (event) => {
        const ws_mssg: WebSocketMessage = JSON.parse(event.data);

        switch (ws_mssg.type as keyof MessageTypeMap) {
          case "message":
            const chatMessage: WSChatMessageData = ws_mssg.data;
            addMessageToChat(chatMessage);
            updateLastMessage(chatMessage);
            break;
          case "added_to_chat":
            const addedNotification: WSUserAddedData = ws_mssg.data;
            handleUserAddedToChat(addedNotification);
            break;
          // case "removed_from_chat":
          //   const removedMessage: WSUserRemovedData = ws_mssg.data;
          //   break;
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected.");
      };

      return () => {
        ws.onmessage = null;
        ws.onclose = null;
      };
    },
    [websocketQuery.data]
  );

  /**
   * Subscribe to a specific chat
   * @param - id of chat to subscribe to
   */
  const subscribeToChat = useCallback(
    (chatId: string) => {
      const ws = websocketQuery.data;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "subscribe",
            chatId: chatId,
          })
        );
      }
    },
    [websocketQuery.data]
  );

  /**
   * Unsubscribe from a specific chat
   * @param - id of chat to unsubscribe from
   */
  const unsubscribeFromChat = useCallback(
    (chatId: string) => {
      const ws = websocketQuery.data;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "unsubscribe",
            chatId: chatId,
          })
        );
      }
    },
    [websocketQuery.data]
  );

  /**
   * Manually close the WebSocket connection
   */
  const disconnect = useCallback(() => {
    if (websocketQuery.data) {
      websocketQuery.data.close();
    }
  }, [websocketQuery.data]);

  return {
    /** WebSocket instance */
    ws: websocketQuery.data,
    /** WebSocket connection status */
    isConnecting: websocketQuery.isLoading,
    /** WebSocket error */
    error: websocketQuery.error,
    /** Function to connect and set up message handlers */
    connect,
    /** Subscribe to a chat */
    subscribeToChat,
    /** Unsubscribe from a chat */
    unsubscribeFromChat,
    /** Manually disconnect */
    disconnect,
    /** Refetch/Reconnect the WebSocket */
    refetch: websocketQuery.refetch,
  };
};
