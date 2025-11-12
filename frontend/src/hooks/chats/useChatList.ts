import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useApi } from "../common/apiStates";

/**
 * Represents the data structure for displaying a chat in the list view
 */
export interface ChatListItemData {
  /** Unique identifier for the chat in hexadecimal format */
  chatId: string;
  /** Display name of the chat */
  chatName: string;
  /** ISO datetime string of when the last chat activity occurred */
  lastActivity: string;
  /** Optional identifier of the other user in direct messages (hexadecimal format) */
  otherUserId?: string;
}

/**
 * Custom hook for managing chat list operations and state
 *
 * @remarks
 * Provides functionality for fetching, creating, and managing chats.
 * Handles authentication redirects and maintains chat list state.
 * Includes automatic sorting of chats by most recent activity.
 */
export const useChatList = () => {
  const navigate = useNavigate();
  const api = useApi<ChatListItemData[]>();

  /**
   * Fetches all chats that the current user is participating in
   *
   * @remarks
   * Automatically handles session expiration by redirecting to login page.
   * Updates the chat list state with fetched data on success.
   */
  const fetchChats = useCallback(async () => {
    api.setLoading();

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
        const data: ChatListItemData[] = await response.json();
        api.setSuccess(data);
      } else {
        api.setError("Failed to fetch chats");
      }
    } catch (err) {
      api.setError("Internal Server Error");
    }
  }, [api, navigate]);

  /**
   * Fetches publicly available chats that the user is not currently participating in
   *
   * @remarks
   * Useful for discovering new chats to join. Handles authentication redirects
   * and updates the available chats state.
   */
  const fetchAvailableChats = useCallback(async () => {
    api.setLoading();

    try {
      const response = await fetch(
        "https://localhost:8000/chats/available-chats",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.status === 401) {
        navigate("/login", { state: { sessionExpired: true } });
        return;
      }

      if (response.ok) {
        const data: ChatListItemData[] = await response.json();
        api.setSuccess(data);
      } else {
        api.setError("Failed to fetch chats");
      }
    } catch (err) {
      api.setError("Internal Server Error");
    }
  }, [api, navigate]);

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
          api.setError("Error occurred when creating chat.");
          return;
        }

        const newChat: ChatListItemData = await response.json();
        if (api.data) {
          api.setSuccess([...api.data, newChat]);
        } else {
          api.setSuccess([newChat]);
        }
      } catch (err) {
        api.setError("Internal Server Error.");
      }
    },
    [api]
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
      if (!api.data) return;

      const filteredChats = api.data.filter((chat) => chat.chatId !== chatId);
      api.setSuccess(filteredChats);
    },
    [api]
  );

  return {
    /** Array of chat items, empty array if no chats are loaded */
    chats: api.data || [],
    /** Indicates if a chat operation is currently in progress */
    loading: api.isLoading,
    /** Error message from the last failed operation, empty string if no error */
    error: api.error,
    /** Current state of the chat list operations */
    state: api.state,

    /** Function to fetch user's participating chats */
    fetchChats,
    /** Function to fetch discoverable public chats */
    fetchAvailableChats,
    /** Function to create a new chat */
    createChat,
    /** Function to remove a chat from local state */
    removeChat,

    /** Chats sorted by most recent activity in descending order */
    sortedChats: (api.data || []).sort(
      (prev, next) =>
        new Date(next.lastActivity).getTime() -
        new Date(prev.lastActivity).getTime()
    ),
  };
};
