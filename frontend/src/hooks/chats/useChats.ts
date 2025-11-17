import { useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { useApi } from "../common/apiStates";

/**
 * Represents the data structure for displaying a chat in the list view
 *
 * @remarks
 * From chatId to lastActivity, these fields match exactly with the backend ChatPreview type.
 * Messages are populated lazily when the chat is selected.
 */
export interface ChatData {
  /** Unique identifier for the chat in hexadecimal format */
  chatId: string;
  /** Display name of the chat */
  chatName: string;
  /** Optional identifier of the other user in direct messages (hexadecimal format) */
  dmParticipantId?: string;
  /** Last message sent in the chat. */
  lastMessage: string;
  /** ISO datetime string of when the last chat activity occurred */
  lastActivity: string;
  /** List of all messages sent in chat. */
  messages: Message[];
}

/**
 * Represents a message within a chat
 */
interface Message {
  messageId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

// Default number of messages backend fetches in chat history
const COUNT_DEFAULT = 20;

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
  const chatApi = useApi<ChatData[]>();
  // Stores data for global chat previews
  const globalChatApi = useApi<ChatData[]>();

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
    chatApi.setLoading();

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
        const responseData = await response.json();
        const data: ChatData[] = responseData.map(
          (chat: Omit<ChatData, "messages">) => ({
            ...chat,
            messages: [],
          })
        );
        chatApi.setSuccess(data);
      } else {
        chatApi.setError("Failed to fetch chats");
      }
    } catch (err) {
      chatApi.setError("Internal Server Error");
    }
  }, [chatApi, navigate]);

  /**
   * Fetches publicly available chats that the user is not currently participating in
   *
   * @remarks
   * Useful for discovering new chats to join. Handles authentication redirects
   * and updates the available chats state.
   */
  const fetchGlobalChats = useCallback(async () => {
    // When uncommenting / fixing use globalChatApi instead of chatApi
    // chatApi.setLoading();
    // try {
    //   const response = await fetch(
    //     "https://localhost:8000/chats/available-chats",
    //     {
    //       method: "GET",
    //       credentials: "include",
    //     }
    //   );
    //   if (response.status === 401) {
    //     navigate("/login", { state: { sessionExpired: true } });
    //     return;
    //   }
    //   if (response.ok) {
    //     const responseData = await response.json();
    //     const data: ChatData[] = responseData.map(
    //       (chat: Omit<ChatData, "messages">) => ({
    //         ...chat,
    //         messages: [],
    //       })
    //     );
    //     chatApi.setSuccess(data);
    //   } else {
    //     chatApi.setError("Failed to fetch chats");
    //   }
    // } catch (err) {
    //   chatApi.setError("Internal Server Error");
    // }
  }, [chatApi, navigate]);

  /** Fetches Chat History from backend. If some message history has already been fetched,
   *  fetch "count" number of messages before the earliest fetched message.
   *
   * @param chatId - ID of the chat to fetch history for
   * @param count - Number of messages to fetch (Backend's default is 20)
   */
  const fetchChatHistory = useCallback(
    async (chatId: string, count?: number) => {
      const currentChats = chatApi.data;
      if (!currentChats) {
        chatApi.setError("No chats data available");
        return;
      }

      let chatData = currentChats.find((chat) => chat.chatId === chatId);
      if (!chatData) {
        chatApi.setError("Chat not found");
        return;
      }

      // If count not specified and we already have enough messages, do not fetch more
      if (!count && chatData.messages.length >= COUNT_DEFAULT) {
        return;
      }

      chatApi.setLoading();

      let url = `https://localhost:8000/chats/${chatId}?`;
      if (chatData.messages.length > 0) {
        let startMessageId =
          chatData.messages[chatData.messages.length - 1].messageId;
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

          const updatedChats = currentChats.map((chat) =>
            chat.chatId === chatId
              ? { ...chat, messages: [...chat.messages, ...messages] }
              : chat
          );

          chatApi.setSuccess(updatedChats);
        } else {
          chatApi.setError(`Failed to fetch: ${response.status}`);
        }
      } catch (err) {
        chatApi.setError("Internal Server Error");
      }
    },
    [chatApi, navigate]
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
  const connectToChats = useCallback((chats: ChatData[]) => {
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
        const messageData: Message = JSON.parse(event.data);
        chat.lastActivity = messageData.timestamp;
        chat.lastMessage = messageData.content;
        chat.messages = [...(chat.messages || []), messageData];
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
  const getChatFromId = useCallback(
    (chatId: string): ChatData | undefined => {
      return chatApi.data?.find((chat) => chat.chatId === chatId);
    },
    [chatApi]
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
          chatApi.setError("Error occurred when creating chat.");
          return;
        }

        const newChat: ChatData = await response.json();
        if (chatApi.data) {
          chatApi.setSuccess([...chatApi.data, newChat]);
        } else {
          chatApi.setSuccess([newChat]);
        }
      } catch (err) {
        chatApi.setError("Internal Server Error.");
      }
    },
    [chatApi]
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
      if (!chatApi.data) return;

      const filteredChats = chatApi.data.filter(
        (chat) => chat.chatId !== chatId
      );
      chatApi.setSuccess(filteredChats);
    },
    [chatApi]
  );

  return {
    /** Array of chat items, empty array if no chats are loaded */
    chats: chatApi.data || [],
    /** Indicates if a chat operation is currently in progress */
    loading: chatApi.isLoading,
    /** Error message from the last failed operation, empty string if no error */
    error: chatApi.error,

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
    /** Function to fetch discoverable public chats */
    fetchGlobalChats,
    /** Function to fetch message history for a specific chat */
    fetchChatHistory,
    /** Function to connect websockets for real-time chat updates */
    connectToChats,
    /** Function to get a chat by its unique identifier */
    getChatFromId,
    /** Function to get the WebSocket for a specific chat by its ID */
    getSocketFromId,
    /** Function to create a new chat */
    createChat,
    /** Function to remove a chat from local state */
    removeChat,

    /** Chats sorted by most recent activity in descending order */
    sortedChatPreviews: (chatApi.data || []).sort(
      (prev, next) =>
        new Date(next.lastActivity).getTime() -
        new Date(prev.lastActivity).getTime()
    ),
  };
};
