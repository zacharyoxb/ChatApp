import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useApi } from "../common/apiStates";

/**
 * Stores the data needed to preview a chat.
 *
 * @param chatId - hex string of the id of the chat
 * @param chatName - name of the chat
 * @param lastMessageAt - time last message was sent in ISO datetime format
 * @param otherUserId - hex string of the id of the other user (if it is a dm)
 */
export interface ChatListItemData {
  chatId: string;
  chatName: string;
  lastMessageAt: string;
  otherUserId?: string;
}
/**
 * Hook that allows easy fetching/updating of user chats.
 */
export const useChatList = () => {
  const navigate = useNavigate();
  const api = useApi<ChatListItemData[]>();

  const fetchChats = useCallback(async () => {
    api.setLoading();

    try {
      const response = await fetch("https://localhost:8000/chats", {
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
          return false;
        }

        // Refresh chats after creation
        await fetchChats();
        return true;
      } catch (err) {
        api.setError("Internal Server Error.");
        return false;
      }
    },
    [api, fetchChats]
  );

  const removeChat = useCallback(
    // This doesn't actually remove user but is fine placeholder code
    (chatId: string) => {
      if (!api.data) return;

      const filteredChats = api.data.filter((chat) => chat.chatId !== chatId);
      api.setSuccess(filteredChats);
    },
    [api]
  );

  return {
    chats: api.data || [],
    loading: api.isLoading,
    error: api.error,
    state: api.state,

    fetchChats,
    createChat,
    removeChat,

    sortedChats: (api.data || []).sort(
      (prev, next) =>
        new Date(next.lastMessageAt).getTime() -
        new Date(prev.lastMessageAt).getTime()
    ),
  };
};
