import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useApi } from "../common/apiStates";

export type UserRole = "owner" | "admin" | "member";

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
  lastMessage: Message;
  /** Role of user in non-dm chat */
  myRole?: UserRole;
}

/**
 * Represents a message within a chat
 */
export interface Message {
  /** Unique identifier for the message */
  messageId: string;
  /** Sender's user ID in hexadecimal format (null for system messages) */
  senderId: string | null;
  /** Content of the message */
  content: string;
  /** ISO datetime string of when the message was sent */
  timestamp: string;
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
  // ChatList data
  // Stores data for chat previews
  const chatPreviewApi = useApi<ChatPreview[]>();
  // Stores messages
  const [messagesByChatId, setMessagesByChatId] = useState<
    Map<string, Message[]>
  >(new Map());

  // References to store websockets
  const websocketRefs = useRef<Map<string, WebSocket>>(new Map());

  /**
   * Fetches all chats that the current user is participating in
   *
   * @remarks
   * Automatically handles session expiration by redirecting to login page.
   * Updates the chat list state with fetched data on success.
   */
  const fetchChats = useCallback(async () => {
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
  }, [chatPreviewApi, navigate]);

  /**
   * Helper function to add a message to a specific chat
   */
  const addMessageToChat = useCallback(
    (chatId: string, message: Message) => {
      setMessagesByChatId((prev) => {
        const newMap = new Map(prev);
        const existingMessages = newMap.get(chatId) || [];
        newMap.set(chatId, [...existingMessages, message]);
        return newMap;
      });
      // change in future
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
    [chatPreviewApi]
  );

  /**
   * Helper function to add multiple messages to a specific chat
   */
  const addMessagesToChat = useCallback(
    (chatId: string, newMessages: Message[]) => {
      setMessagesByChatId((prev) => {
        const newMap = new Map(prev);
        const existingMessages = newMap.get(chatId) || [];
        newMap.set(chatId, [...existingMessages, ...newMessages]);
        return newMap;
      });
    },
    []
  );

  /** Fetches Chat History from backend. If some message history has already been fetched,
   *  fetch "count" number of messages before the earliest fetched message.
   *
   * @param chatId - ID of the chat to fetch history for
   * @param count - Number of messages to fetch (Backend's default is 20)
   */
  const fetchChatHistory = useCallback(
    async (chatId: string, count?: number) => {
      let messages = messagesByChatId.get(chatId);
      if (!messages) {
        messages = [];
      }

      let url = `https://localhost:8000/chats/${chatId}?`;
      if (messages.length > 0) {
        let startMessageId = messages[messages.length - 1].messageId;
        url += `start_id=${startMessageId}&`;
      }
      if (count) {
        url += `count=${count}&`;
      }

      try {
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
          navigate("/login", { state: { sessionExpired: true } });
          return;
        }

        if (response.ok) {
          const messages: Message[] = await response.json();
          addMessagesToChat(chatId, messages);
        } else {
          chatPreviewApi.setError(`Failed to fetch: ${response.status}`);
        }
      } catch (err) {
        chatPreviewApi.setError("Internal Server Error");
      }
    },
    [messagesByChatId, chatPreviewApi, navigate, addMessagesToChat]
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
        const messageData: Message = JSON.parse(firstParse);

        addMessageToChat(chat.chatId, messageData);
      };

      ws.onclose = () => {
        console.log(`WebSocket disconnected for chat ${chat.chatId}`);
        websocketRefs.current.delete(chat.chatId);
      };
    });
  }, []);

  /**
   * Retrieves a chat by its unique identifier
   *
   * @param chatId - Unique identifier of the chat to retrieve
   * @returns The ChatData object if found, otherwise undefined
   *
   * @remarks
   * Searches the current chat list for a chat matching the provided ID.
   */
  const getChatDataFromId = useCallback(
    (chatId: string): ChatPreview | undefined => {
      return chatPreviewApi.data?.find((chat) => chat.chatId === chatId);
    },
    [chatPreviewApi]
  );

  /**
   * Get messages for a specific chat
   */
  const getMessagesForChat = useCallback(
    (chatId: string): Message[] => {
      return messagesByChatId.get(chatId) || [];
    },
    [messagesByChatId]
  );

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
    async (chatName: string, otherUsers: string[], isPublic: boolean) => {
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
        if (chatPreviewApi.data) {
          chatPreviewApi.setSuccess([...chatPreviewApi.data, newChat]);
        } else {
          chatPreviewApi.setSuccess([newChat]);
        }
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
    /** Array of chat items, empty array if no chats are loaded */
    chats: chatPreviewApi.data || [],
    /** Indicates if a chat operation is currently in progress */
    loading: chatPreviewApi.isLoading,
    /** Error message from the last failed operation, empty string if no error */
    error: chatPreviewApi.error,

    /** Array of global chat items, empty array if no chats are loaded */
    // globalChats: globalChatApi.data || [],
    /** Indicates if a global chat operation is currently in progress */
    // globalLoading: globalChatApi.isLoading,
    /** Error message from the last failed global chat operation, empty string if no error */
    // globalError: globalChatApi.error,e
    /** Current state of the global chat list operations */
    // globalState: globalChatApi.state,

    /** Function to fetch user's participating chats */
    fetchChats,
    /** Function to fetch message history for a specific chat */
    fetchChatHistory,
    /** Function to connect websockets for real-time chat updates */
    connectToChats,
    /** Function to get a chat by its unique identifier */
    getChatDataFromId,
    /** Function to get a chat's messages by its unique identifier */
    getMessagesForChat,
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
