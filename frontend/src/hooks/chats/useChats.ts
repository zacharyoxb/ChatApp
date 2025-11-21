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
  /** Optional identifier of the other user in direct messages (hexadecimal format) */
  dmParticipantId?: string;
  /** Last message sent in the chat */
  lastMessage: ChatMessage;
  /** Role of user in non-dm chat */
  myRole?: UserRole;
}

export interface ChatDetails {
  chatId: string;
  participants: UserInfo[];
  messages: ChatMessage[];
}

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
  const websocketRefs = useRef<Map<string, WebSocket>>(new Map());

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
        navigate("/login", { state: { sessionExpired: true } });
        return;
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
    (chatId: string, message: ChatMessage) => {
      chatDetailsApi.setSuccess((prev) => {
        const currentMap = prev || new Map<string, ChatDetails>();

        const chatDetails = currentMap.get(chatId);
        if (!chatDetails) {
          return currentMap;
        }

        const sender = chatDetails.participants.find(
          (user) => user.userId == message.senderId
        );

        message.senderUsername = sender?.username || "UNKNOWN";

        const updatedChatDetails = {
          ...chatDetails,
          messages: [...chatDetails.messages, message],
        };

        return new Map(prev).set(chatId, updatedChatDetails);
      });

      chatPreviewApi.setSuccess((prevData) => {
        if (!prevData) {
          return [];
        }

        const updatedChats = prevData.map((chat) =>
          chat.chatId === chatId
            ? {
                ...chat,
                lastMessage: message,
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

  /**
   * Establishes WebSocket connections for real-time chat updates
   *
   * @param chats - Array of ChatData objects to connect websockets for
   *
   * @remarks
   * Initializes a WebSocket for each chat to receive live updates.
   * Stores WebSocket references for future use.
   */
  const connectToChats = useCallback((chats: ChatPreview[]) => {
    chats.forEach((chat) => {
      if (websocketRefs.current.has(chat.chatId)) {
        return;
      }
      const ws = new WebSocket(`wss://localhost:8000/ws/chats/${chat.chatId}`);

      websocketRefs.current.set(chat.chatId, ws);

      ws.onopen = () => {
        console.log(`WebSocket connected for chat ${chat.chatId}`);
      };

      ws.onmessage = (event) => {
        const firstParse = JSON.parse(event.data);
        const messageData: ChatMessage = JSON.parse(firstParse);

        addMessageToChat(chat.chatId, messageData);
      };

      ws.onclose = () => {
        console.log(`WebSocket disconnected for chat ${chat.chatId}`);
        websocketRefs.current.delete(chat.chatId);
      };
    });
  }, []);

  /**
   * Retrieves the WebSocket connection for a specific chat by its ID
   *
   * @param chatId - Unique identifier of the chat
   * @returns The WebSocket object if a connection exists, otherwise undefined
   *
   * @remarks
   * Useful for sending messages or performing actions over the chat's WebSocket.
   */
  const getSocketFromId = useCallback(
    (chatId: string): WebSocket | undefined => {
      return websocketRefs.current.get(chatId);
    },
    []
  );

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

        navigate(`/chats/${newChat.chatId}`);
      } catch (err) {
        chatPreviewApi.setError("Internal Server Error.");
      }
    },
    [chatPreviewApi]
  );

  /**
   * Removes a chat from the local state (client-side only)
   *
   * @param chatId - ID of the chat to remove from the local list
   *
   * @remarks
   * This is a client-side operation that does not persist to the server.
   * Primarily useful for immediate UI updates before server synchronization.
   */
  const removeChat = useCallback(
    (chatId: string) => {
      if (!chatPreviewApi.data) return;

      const filteredChats = chatPreviewApi.data.filter(
        (chat) => chat.chatId !== chatId
      );
      chatPreviewApi.setSuccess(filteredChats);
    },
    [chatPreviewApi]
  );

  const sortedChatPreviews = useMemo(() => {
    return (chatPreviewApi.data || []).sort(
      (prev, next) =>
        new Date(next.lastMessage.timestamp).getTime() -
        new Date(prev.lastMessage.timestamp).getTime()
    );
  }, [chatPreviewApi.data]);

  return {
    /** Array of chat previews, empty array if no chats are loaded */
    chatPreviews: chatPreviewApi.data || [],
    /** Indicates if a chat preview operation is currently in progress */
    isLoadingPreviews: chatPreviewApi.isLoading,
    /** Error message from the last failed chat preview operation, empty string if no error */
    isErrorPreviews: chatPreviewApi.error,

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
    /** Function to connect websockets for real-time chat updates */
    connectToChats,
    /** Function to get the WebSocket for a specific chat by its ID */
    getSocketFromId,
    /** Function to create a new chat */
    createChat,
    /** Function to remove a chat from local state */
    removeChat,

    /** Chats sorted by most recent activity in descending order */
    sortedChatPreviews,
  };
};
