import { useCallback, useRef } from "react";
import type {
  MessageTypeMap,
  UserInfo,
  WebSocketMessage,
  WSChatMessageData,
} from "../../types/chats";

/**
 * Custom hook for fetching previews of chats and the creation and deletion of chats.
 *
 * @remarks
 * Provides functionality for fetching and creating chats.
 * Handles authentication redirects and maintains chat list state.
 * Includes automatic sorting of chats by most recent activity.
 */
export const useChats = () => {
  // References to store websockets
  const ws = useRef<WebSocket>(null);

  /** Fetches UserInfo from backend for a specific user.
   *
   * @param username - Username to get userinfo for
   *
   * @returns userInfo for user.
   */
  const fetchUserInfo = useCallback(async (username: string) => {
    try {
      const response = await fetch(`https://localhost:8000/users/${username}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 404) {
        return null;
      }

      const userInfo: UserInfo = await response.json();
      return userInfo;
    } catch (err) {
      console.log(err);
    }
    return null;
  }, []);

  /**
   * Establishes WebSocket connection for real-time chat updates
   *
   * @param addMessageToChat - adds message to ChatDetails
   * @param updateLastMessage - updates last message in ChatPreviews
   *
   * @remarks
   * Initializes a WebSocket for the user to receive live updates.
   * Stores WebSocket reference.
   */
  const connectWebsocket = useCallback(
    (
      addMessageToChat: (messageData: WSChatMessageData) => void,
      updateLastMessage: (messageData: WSChatMessageData) => void
    ) => {
      if (ws.current && ws.current.OPEN) {
        return;
      }

      ws.current = new WebSocket("https://localhost:8000/ws/chats");
      ws.current.onopen = () => {
        console.log("WebSocket connected.");
      };

      ws.current.onmessage = (event) => {
        const ws_mssg: WebSocketMessage = JSON.parse(event.data);

        switch (ws_mssg.type as keyof MessageTypeMap) {
          case "message":
            const chatMessage: WSChatMessageData = ws_mssg.data;
            addMessageToChat(chatMessage);
            updateLastMessage(chatMessage);
            break;
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected.");
        ws.current = null;
      };
    },
    []
  );

  return {
    /** Websocket for user */
    chatWebsocket: ws.current,

    /** Function to fetch user info for a specific user */
    fetchUserInfo,
    /** Function to connect websockets for real-time chat updates */
    connectWebsocket,
  };
};
