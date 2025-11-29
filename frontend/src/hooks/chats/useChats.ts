import { useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { useApi } from "../common/apiStates";

/** Represents the role of a user in a chat */
export type UserRole = "owner" | "admin" | "member";

/**
 * Represents the information for each user in a chat
 */
export interface UserInfo {
  /** Unique identifier for user */
  userId: string;
  /** Username of user */
  username: string;
  /** Role of user in chat */
  role: UserRole;
}

/**
 * Represents a message within a chat
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  messageId: string;
  /** Sender's user ID in hexadecimal format (null for system messages) */
  senderId: string;
  /** Sender's username for display purposes */
  senderUsername: string;
  /** Content of the message */
  content: string;
  /** ISO datetime string of when the message was sent */
  timestamp: string;
}

/**
 * Represents the data structure for displaying a chat in the list view
 *
 * @remarks
 * These fields match exactly with the backend ChatPreview type.
 */
export interface ChatPreview {
  /** Unique identifier for the chat in hexadecimal format */
  chatId: string;
  /** Display name of the chat */
  chatName: string;
  /** ISO datetime string of the creation time of the chat */
  createdAt: string;
  /** Optional identifier of the other user in direct messages (hexadecimal format) */
  dmParticipantId?: string;
  /** Last message sent in the chat */
  lastMessage?: ChatMessage;
  /** Role of user in non-dm chat */
  myRole?: UserRole;
}

/** Details for the chat when its displayed in LiveChat */
export interface ChatDetails {
  /** Unique identifier for the chat in hexadecimal format */
  chatId: string;
  /** All participants in the chat */
  participants: UserInfo[];
  /** Messages in the chat */
  messages: ChatMessage[];
}

/** Types describing format of websocket messages. */
interface WebSocketMessage<T = any> {
  type: string;
  data: T;
}

interface WSChatMessageData {
  chatId: string;
  message: ChatMessage;
}

// interface WSTypingIndicatorData {
//   chatId: string;
//   userId: string;
//   username: string;
//   isTyping: boolean;
// }

// interface WSUserAddedData {
//   chatId: string;
//   addedBy: string;
// }

// interface WSUserRemovedData {
//   chatId: string;
//   removedBy: string;
// }

// Message type to data type mapping
type MessageTypeMap = {
  message: WSChatMessageData;
  // typing_indicator: WSTypingIndicatorData;
  // user_added: WSUserAddedData;
  // user_removed: WSUserRemovedData;
};

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
   * Fetches all chats that the current user is participating in
   *
   * @remarks
   * Automatically handles session expiration by redirecting to login page.
   * Updates the chat list state with fetched data on success.
   */
  const fetchChatPreviews = useCallback(async () => {
    chatPreviewApi.setLoading();

    try {
      const response = await fetch("https://localhost:8000/chats/my-chats", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.detail === "SESSION_EXPIRED") {
          navigate("/login", { state: { sessionExpired: true } });
        } else {
          navigate("/login", { state: { noCookie: true } });
          return;
        }
      }

      if (response.ok) {
        const data: ChatPreview[] = await response.json();
        chatPreviewApi.setSuccess(data);
      } else {
        chatPreviewApi.setError("Failed to fetch chats");
      }
    } catch (err) {
      chatPreviewApi.setError("Internal Server Error");
    }
  }, [chatPreviewApi.data, navigate]);

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

      console.log(ws_mssg);

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

  /**
   * Creates a new chat with specified parameters
   *
   * @param chatName - Display name for the new chat
   * @param otherUsers - Array of user IDs to add to the chat
   * @param isPublic - Whether the chat should be publicly discoverable
   *
   * @remarks
   * Automatically updates chat data after operation.
   */
  const createChat = useCallback(
    async (chatName: string, otherUsers: UserInfo[], isPublic: boolean) => {
      try {
        const response = await fetch("https://localhost:8000/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatName,
            otherUsers,
            isPublic,
          }),
          credentials: "include",
        });

        if (response.status !== 201) {
          chatPreviewApi.setError("Error occurred when creating chat.");
          return;
        }

        const newChat: ChatPreview = await response.json();

        chatPreviewApi.setSuccess((prev) => {
          const safePrev = prev || [];
          const updatedChatPreviews = [...safePrev, newChat];
          return updatedChatPreviews;
        });

        ws.current?.send(
          JSON.stringify({
            type: "subscribe",
            chatId: newChat.chatId,
          })
        );

        navigate(`/chats/${newChat.chatId}`);
      } catch (err) {
        chatPreviewApi.setError("Internal Server Error.");
      }
    },
    [chatPreviewApi]
  );

  /** Sorts chat previews by timestamp of last message
   *
   * @remarks
   * Order of chats
   * 1. Most recently created chats with no messages (i.e. those
   *    that appear latest in the list)
   */
  const sortedChatPreviews = useMemo(() => {
    return (chatPreviewApi.data || []).sort((prev, next) => {
      const nextTime = next.lastMessage
        ? next.lastMessage.timestamp
        : next.createdAt;
      const prevTime = prev.lastMessage
        ? prev.lastMessage.timestamp
        : prev.createdAt;

      return new Date(nextTime).getTime() - new Date(prevTime).getTime();
    });
  }, [chatPreviewApi.data]);

  return {
    /** Array of chat previews, empty array if no chats are loaded */
    chatPreviews: chatPreviewApi.data || [],
    /** Indicates if a chat preview operation is currently in progress */
    isLoadingPreviews: chatPreviewApi.isLoading,
    /** Error message from the last failed chat preview operation, empty string if no error */
    isErrorPreviews: chatPreviewApi.error,
    /** Websocket for user */
    chatWebsocket: ws.current,

    /** Array of chat details, empty array if no chats are loaded */
    chatDetails: chatDetailsApi.data || new Map<string, ChatDetails>(),
    /** Indicates if a chat details operation is currently in progress */
    isLoadingDetails: chatDetailsApi.isLoading,
    /** Error message from the last failed chat details operation, empty string if no error */
    isErrorDetails: chatDetailsApi.error,

    /** Function to fetch user's participating chats */
    fetchChatPreviews,
    /** Function to fetch details for a specific chat */
    fetchChatDetails,
    /** Function to fetch user info for a specific user */
    fetchUserInfo,
    /** Function to connect websockets for real-time chat updates */
    connectWebsocket,
    /** Function to create a new chat */
    createChat,
    /** Chats sorted by most recent activity in descending order */
    sortedChatPreviews,
  };
};
