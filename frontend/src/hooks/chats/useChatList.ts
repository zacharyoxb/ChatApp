import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

export interface ChatListItemData {
  chat_id: string; // hex string
  chat_name: string;
  last_message_at: string; // ISO datetime format
  other_user_id?: string; // hex string
}

interface UseChatListProps {
  autoFetch?: boolean;
}

export const useChatList = (props: UseChatListProps) => {
  const { autoFetch = true } = props;
  const [chats, setChats] = useState<ChatListItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("https://localhost:8000/chats", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/login", {
          state: { sessionExpired: true },
        });
        return;
      }

      if (response.ok) {
        const data: ChatListItemData[] = await response.json();
        setChats(data);
      } else {
        setError("Failed to fetch chats");
      }
    } catch (err) {
      setError("Internal Server Error");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const createChat = useCallback(
    async (chatName: string, members: string[], isPublic: boolean) => {
      try {
        setError(null);
        const response = await fetch("https://localhost:8000/chats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_name: chatName,
            other_users: members,
            is_public: isPublic,
          }),
          credentials: "include",
        });

        if (response.status !== 201) {
          setError("Error occurred when creating chat.");
          return false;
        }

        // Refresh the chats list to include the new chat
        await fetchChats();
        return true;
      } catch (err) {
        setError("Internal Server Error.");
        return false;
      }
    },
    [fetchChats]
  );

  const updateChat = useCallback(
    (chatId: string, updates: Partial<ChatListItemData>) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.chat_id === chatId ? { ...chat, ...updates } : chat
        )
      );
    },
    []
  );

  const removeChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.chat_id !== chatId));
  }, []);

  // Auto-fetch chats on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchChats();
    }
  }, [autoFetch, fetchChats]);

  return {
    // State
    chats,
    loading,
    error,

    // Actions
    fetchChats,
    createChat,
    updateChat,
    removeChat,
    setError,

    sortedChats: [...chats].sort(
      (prev_chat, next_chat) =>
        new Date(prev_chat.last_message_at).getTime() -
        new Date(next_chat.last_message_at).getTime()
    ),
  };
};
