import { useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { useApi } from "../common/apiStates";
import type {
  ChatDetails,
  ChatMessage,
  ChatPreview,
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
  const navigate = useNavigate();
  // Stores data for chat previews
  const chatPreviewApi = useApi<ChatPreview[]>();
  // Stores chat details
  const chatDetailsApi = useApi<Map<string, ChatDetails>>();
  // References to store websockets
  const ws = useRef<WebSocket>(null);

  /**
   * Helper function to add a message to a specific chat
   */
  const addMessageToChat = useCallback(
    (data: WSChatMessageData) => {
      chatDetailsApi.setSuccess((prev) => {
        const currentMap = prev || new Map<string, ChatDetails>();

        const chatDetails = currentMap.get(data.chatId);
        if (!chatDetails) {
          return currentMap;
        }

        const sender = chatDetails.participants.find(
          (user) => user.userId == data.message.senderId
        );

        data.message.senderUsername = sender?.username || "UNKNOWN";

        const updatedChatDetails = {
          ...chatDetails,
          messages: [...chatDetails.messages, data.message],
        };

        return new Map(prev).set(data.chatId, updatedChatDetails);
      });

      chatPreviewApi.setSuccess((prevData) => {
        if (!prevData) {
          return [];
        }

        const updatedChats = prevData.map((chat) =>
          chat.chatId === data.chatId
            ? {
                ...chat,
                lastMessage: data.message,
              }
            : { ...chat }
        );
        return updatedChats;
      });
    },
    [chatPreviewApi.data, chatDetailsApi.data]
  );

  /**
   * Helper function to add multiple messages to a specific chat
   */
  const addMessagesToChat = useCallback(
    (chatId: string, newMessages: ChatMessage[]) => {
      chatDetailsApi.setSuccess((prev) => {
        const currentMap = prev || new Map<string, ChatDetails>();

        const chatDetails = currentMap.get(chatId);
        if (!chatDetails) {
          return currentMap;
        }

        const updatedChatDetails = {
          ...chatDetails,
          messages: [...chatDetails.messages, ...newMessages],
        };

        return new Map(prev).set(chatId, updatedChatDetails);
      });
    },
    [chatDetailsApi]
  );

  /** Fetches ChatDetails from backend
   *
   * @param chatId - ID of the chat to fetch details for
   */
  const fetchChatDetails = useCallback(
    async (chatId: string) => {
      chatDetailsApi.setLoading();
      try {
        const response = await fetch(`https://localhost:8000/chats/${chatId}`, {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
          navigate("/login", { state: { sessionExpired: true } });
          return;
        }

        if (response.ok) {
          const chatDetails: ChatDetails = await response.json();
          chatDetailsApi.setSuccess((prev) => {
            return new Map(prev).set(chatId, chatDetails);
          });
        } else {
          chatPreviewApi.setError(`Failed to fetch: ${response.status}`);
        }
      } catch (err) {
        chatPreviewApi.setError("Internal Server Error");
      }
    },
    [chatDetailsApi, navigate, addMessagesToChat]
  );

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
   * @remarks
   * Initializes a WebSocket for the user to receive live updates.
   * Stores WebSocket reference.
   */
  const connectWebsocket = useCallback(() => {
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
          break;
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected.");
      ws.current = null;
    };
  }, []);

  return {
    /** Array of chat details, empty array if no chats are loaded */
    chatDetails: chatDetailsApi.data || new Map<string, ChatDetails>(),
    /** Indicates if a chat details operation is currently in progress */
    isLoadingDetails: chatDetailsApi.isLoading,
    /** Error message from the last failed chat details operation, empty string if no error */
    isErrorDetails: chatDetailsApi.error,
    /** Websocket for user */
    chatWebsocket: ws.current,

    /** Function to fetch details for a specific chat */
    fetchChatDetails,
    /** Function to fetch user info for a specific user */
    fetchUserInfo,
    /** Function to connect websockets for real-time chat updates */
    connectWebsocket,
  };
};
