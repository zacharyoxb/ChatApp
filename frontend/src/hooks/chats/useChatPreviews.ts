import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useApi } from "../common/apiStates";

/**
 * Represents the data structure for displaying a chat in the list view
 */
export interface ChatPreview {
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
}

/**
 * Custom hook for fetching previews of chats and the creation and deletion of chats.
 *
 * @remarks
 * Provides functionality for fetching and creating chats.
 * Handles authentication redirects and maintains chat list state.
 * Includes automatic sorting of chats by most recent activity.
 */
export const useChatPreviews = () => {
  const navigate = useNavigate();
  const previewApi = useApi<ChatPreview[]>();

  /**
   * Fetches all chats that the current user is participating in
   *
   * @remarks
   * Automatically handles session expiration by redirecting to login page.
   * Updates the chat list state with fetched data on success.
   */
  const fetchChatPreviews = useCallback(async () => {
    previewApi.setLoading();

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
        previewApi.setSuccess(data);
      } else {
        previewApi.setError("Failed to fetch chats");
      }
    } catch (err) {
      previewApi.setError("Internal Server Error");
    }
  }, [previewApi, navigate]);

  /**
   * Fetches publicly available chats that the user is not currently participating in
   *
   * @remarks
   * Useful for discovering new chats to join. Handles authentication redirects
   * and updates the available chats state.
   */
  const fetchGlobalChatPreviews = useCallback(async () => {
    previewApi.setLoading();

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
        const data: ChatPreview[] = await response.json();
        previewApi.setSuccess(data);
      } else {
        previewApi.setError("Failed to fetch chats");
      }
    } catch (err) {
      previewApi.setError("Internal Server Error");
    }
  }, [previewApi, navigate]);

  /**
   * Gets a chat preview from the chatId
   *
   * @param chatId - Chat Id to get preview of.
   *
   * @returns Preview of chat if exists, undefined otherwise
   */
  const getPreviewById = useCallback(
    async (chatId: string) => {
      return previewApi.data?.find((item) => {
        item.chatId == chatId;
      });
    },
    [previewApi]
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
          previewApi.setError("Error occurred when creating chat.");
          return;
        }

        const newChat: ChatPreview = await response.json();
        if (previewApi.data) {
          previewApi.setSuccess([...previewApi.data, newChat]);
        } else {
          previewApi.setSuccess([newChat]);
        }
      } catch (err) {
        previewApi.setError("Internal Server Error.");
      }
    },
    [previewApi]
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
      if (!previewApi.data) return;

      const filteredChats = previewApi.data.filter(
        (chat) => chat.chatId !== chatId
      );
      previewApi.setSuccess(filteredChats);
    },
    [previewApi]
  );

  return {
    /** Array of chat items, empty array if no chats are loaded */
    chats: previewApi.data || [],
    /** Indicates if a chat operation is currently in progress */
    loading: previewApi.isLoading,
    /** Error message from the last failed operation, empty string if no error */
    error: previewApi.error,
    /** Current state of the chat list operations */
    state: previewApi.state,

    /** Function to fetch user's participating chats */
    fetchChatPreviews,
    /** Function to fetch discoverable public chats */
    fetchGlobalChatPreviews,
    /** Function to get preview by chat's Id */
    getPreviewById,
    /** Function to create a new chat */
    createChat,
    /** Function to remove a chat from local state */
    removeChat,

    /** Chats sorted by most recent activity in descending order */
    sortedChatPreviews: (previewApi.data || []).sort(
      (prev, next) =>
        new Date(next.lastActivity).getTime() -
        new Date(prev.lastActivity).getTime()
    ),
  };
};
