import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useApi } from "../common/apiStates";

/**
 * Represents the data structure for displaying a chat in the list view
 *
 * @remarks
 * From chatId to lastMessage, these fields match exactly with the backend ChatPreview type.
 * Websockets are initialized by the frontend when fetching the previews,
 * though Messages are populated lazily when the chat is selected.
 */
export interface ChatData {
  /** Unique identifier for the chat in hexadecimal format */
  chatId: string;
  /** Display name of the chat */
  chatName: string;
  /** ISO datetime string of when the last chat activity occurred */
  lastActivity: string;
  /** Optional identifier of the other user in direct messages (hexadecimal format) */
  dmParticipantId?: string;
  /** Last message sent in the chat. Optional. */
  lastMessage?: string;
  /** List of all messages sent in chat. Optional */
  messages?: Messages[];
  /** Websocket for chat updates */
  websocket: WebSocket;
}

/**
 * Represents a message within a chat
 */
interface Messages {
  messageId: string;
  senderId: string;
  content: string;
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
  const chatApi = useApi<ChatData[]>();
  // globalChatApi can be added later when needed for available chats

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
        const data: ChatData[] = await response.json();
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
    //     const data: ChatData[] = await response.json();
    //     chatApi.setSuccess(data);
    //   } else {
    //     chatApi.setError("Failed to fetch chats");
    //   }
    // } catch (err) {
    //   chatApi.setError("Internal Server Error");
    // }
  }, [chatApi, navigate]);

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
    /** Current state of the chat list operations */
    state: chatApi.state,

    /** Function to fetch user's participating chats */
    fetchChats,
    /** Function to fetch discoverable public chats */
    fetchGlobalChats,
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
