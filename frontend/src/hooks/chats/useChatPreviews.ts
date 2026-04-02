import { useCallback } from "react";
import { useNavigate } from "react-router";
import type {
  ChatPreview,
  ChatUserInfo,
  WSChatMessageData,
  WSUserAddedData,
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
          return undefined;
        } else {
          navigate("/login", { state: { noCookie: true } });
          return undefined;
        }
      }

      const data: ChatPreview[] = await response.json();

      return data.sort((prev, next) => {
        const nextTime = next.last_message
          ? new Date(next.last_message.timestamp).getTime()
          : new Date(next.created_at).getTime();

        const prevTime = prev.last_message
          ? new Date(prev.last_message.timestamp).getTime()
          : new Date(prev.created_at).getTime();

        return nextTime - prevTime;
      });
    },
    // WebSocket will notify us of any data
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Creates a new group chat with specified parameters via a POST request
   * and optimistically updates
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
      otherUsers: ChatUserInfo[];
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

      // Only return success confirmation, not chat data
      return { success: true };
    },

    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["chatPreviews"] });

      // Snapshot the previous value
      const previousChats =
        queryClient.getQueryData<ChatPreview[]>(["chatPreviews"]) || [];

      const optimisticChat: ChatPreview = {
        chat_id: `optimistic-${Date.now()}`,
        chat_name: variables.chatName,
        created_at: new Date().toISOString(),
        last_message: undefined,
        is_dummy: true,
      };

      // Optimistically update to the new value
      queryClient.setQueryData<ChatPreview[]>(
        ["chatPreviews"],
        [...previousChats, optimisticChat],
      );

      return {
        optimisticChat,
        previousChats,
      };
    },

    onSuccess: () => {},

    onError: (error: Error, variables, context) => {
      void variables; // hide warning
      console.error("Failed to create chat:", error.message);

      // Rollback to previous state
      if (context?.previousChats) {
        queryClient.setQueryData(["chatPreviews"], context.previousChats);
      }
    },

    // Invalidates to ensure fresh data (after WS should have arrived)
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["chatPreviews"] });
      }, 2000); // 2 second delay as fallback
    },
  });

  /**
   * Handles WebSocket "added_to_chat" messages
   * Updates the preview cache and navigates if needed
   *
   * @param currentUserId - id of current user
   * @param data - data sent by websocket
   */
  const handleUserAddedToChat = useCallback(
    (data: WSUserAddedData) => {
      const { chat_preview } = data;

      // Update chat previews cache
      queryClient.setQueryData<ChatPreview[]>(["chatPreviews"], (prev = []) => {
        const withoutOptimistic = prev.filter(
          (chat) => !chat.chat_id.startsWith("optimistic-"),
        );

        const exists = withoutOptimistic.some(
          (chat) => chat.chat_id === chat_preview.chat_id,
        );

        if (exists) {
          return withoutOptimistic.map((chat) =>
            chat.chat_id === chat_preview.chat_id ? chat_preview : chat,
          );
        }

        return [...withoutOptimistic, chat_preview];
      });

      return chat_preview.chat_id;
    },
    [queryClient, navigate],
  );

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
            chat.chat_id === messageData.chat_id
              ? {
                  ...chat,
                  lastMessage: messageData.message,
                }
              : chat,
          );
        },
      );
    },
    [queryClient],
  );

  return {
    /** Array of chat previews, empty array if no chats are loaded */
    data: fetchPreview.data,
    /** Error message from the last failed chat preview operation, null if no error */
    error: fetchPreview.error,
    /** Function to create a new chat */
    createChatMutation,
    /** Function that handles WS notification of the user being added to a chat */
    handleUserAddedToChat,
    /** Updates the last message sent */
    updateLastMessage,
  };
};
