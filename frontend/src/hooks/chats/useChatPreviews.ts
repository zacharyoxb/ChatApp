import { useMemo } from "react";
import { useNavigate } from "react-router";
import type { ChatPreview, UserInfo } from "../../types/chats";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useChatPreviews = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const previewFetch = useQuery({
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
      ws,
    }: {
      chatName: string;
      otherUsers: UserInfo[];
      isPublic: boolean;
      ws: WebSocket;
    }) => {
      void ws; // prevents warning
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
    onSuccess: (newChat: ChatPreview, variables) => {
      // Update the chat previews cache optimistically
      queryClient.setQueryData(
        ["chatPreviews"],
        (prev: ChatPreview[] | undefined) => {
          const safePrev = prev || [];
          return [...safePrev, newChat];
        }
      );

      // Subscribe to WebSocket for the new chat
      variables.ws.send(
        JSON.stringify({
          type: "subscribe",
          chatId: newChat.chatId,
        })
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

  /** Sorts chat previews by timestamp of last message
   *
   */
  const sortedChatPreviews = useMemo(() => {
    return (previewFetch.data || []).sort((prev, next) => {
      const nextTime = next.lastMessage
        ? next.lastMessage.timestamp
        : next.createdAt;
      const prevTime = prev.lastMessage
        ? prev.lastMessage.timestamp
        : prev.createdAt;

      return new Date(nextTime).getTime() - new Date(prevTime).getTime();
    });
  }, [previewFetch.data]);

  return {
    /** Pending state */
    isPending: previewFetch.isPending,
    /** Error state */
    isError: previewFetch.isError,
    /** Array of chat previews, empty array if no chats are loaded */
    data: previewFetch.data || [],
    /** Error message from the last failed chat preview operation, empty string if no error */
    error: previewFetch.error,
    /** Function to create a new chat */
    createChatMutation,
    /** Chats sorted by most recent activity in descending order */
    sortedChatPreviews,
  };
};
