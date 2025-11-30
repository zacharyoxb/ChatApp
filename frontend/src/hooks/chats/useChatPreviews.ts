import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import type {
  ChatPreview,
  UserInfo,
  WSChatMessageData,
} from "../../types/chats";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useChatPreviews = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchPreview = useQuery({
    queryKey: ["chatPreviews"],
    queryFn: async () => {
      const response = await fetch("https://localhost:8000/chats/my-chats", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.detail === "SESSION_EXPIRED") {
          navigate("/login", { state: { sessionExpired: true } });
          return null;
        } else {
          navigate("/login", { state: { noCookie: true } });
          return null;
        }
      }

      const data: ChatPreview[] = await response.json();
      return data;
    },
  });

  /**
   * Creates a new chat with specified parameters
   *
   * @param chatName - Display name for the new chat
   * @param otherUsers - Array of user IDs to add to the chat
   * @param isPublic - Whether the chat should be publicly discoverable
   *
   * @remarks
   * Automatically updates chat data after operation using TanStack Query
   */
  const createChatMutation = useMutation({
    mutationFn: async ({
      chatName,
      otherUsers,
      isPublic,
    }: {
      chatName: string;
      otherUsers: UserInfo[];
      isPublic: boolean;
    }) => {
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
        throw new Error("Error occurred when creating chat.");
      }

      return await response.json();
    },
    onSuccess: (newChat: ChatPreview) => {
      // Update the chat previews cache optimistically
      queryClient.setQueryData(
        ["chatPreviews"],
        (prev: ChatPreview[] | undefined) => {
          const safePrev = prev || [];
          return [...safePrev, newChat];
        }
      );
      navigate(`/chats/${newChat.chatId}`);
    },
    onError: (error: Error) => {
      console.error("Failed to create chat:", error.message);
    },
    // Refetch chat previews after mutation to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chatPreviews"] });
    },
  });

  /**
   * Updates the last message for a specific chat in the previews cache
   *
   * @param messageData - message data from WebSocket
   */
  const updateLastMessage = useCallback(
    (messageData: WSChatMessageData) => {
      queryClient.setQueryData(
        ["chatPreviews"],
        (prev: ChatPreview[] | undefined) => {
          if (!prev) return prev;

          return prev.map((chat) =>
            chat.chatId === messageData.chatId
              ? {
                  ...chat,
                  lastMessage: messageData.message,
                }
              : chat
          );
        }
      );
    },
    [queryClient]
  );

  /**
   * Sorts chat previews by timestamp of last message
   */
  const sortedChatPreviews = useMemo(() => {
    return (fetchPreview.data || []).sort((prev, next) => {
      const nextTime = next.lastMessage
        ? next.lastMessage.timestamp
        : next.createdAt;
      const prevTime = prev.lastMessage
        ? prev.lastMessage.timestamp
        : prev.createdAt;

      return new Date(nextTime).getTime() - new Date(prevTime).getTime();
    });
  }, [fetchPreview.data]);

  return {
    /** Pending state */
    isPending: fetchPreview.isPending,
    /** Error state */
    isError: fetchPreview.isError,
    /** Success state */
    isSuccess: fetchPreview.isSuccess,

    /** Array of chat previews, empty array if no chats are loaded */
    data: fetchPreview.data || [],
    /** Error message from the last failed chat preview operation, null if no error */
    error: fetchPreview.error,
    /** Function to create a new chat */
    createChatMutation,
    /** Updates the last message sent */
    updateLastMessage,
    /** Chats sorted by most recent activity in descending order */
    sortedChatPreviews,
  };
};
