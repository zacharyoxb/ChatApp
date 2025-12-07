import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type {
  ChatPreview,
  ChatUserInfo,
  WSUserAddedData,
} from "../types/chats";
import { useCallback } from "react";

export const useChatPreviews = () => {
  const navigate = useNavigate();

  return useQuery({
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
        const nextTime = next.lastMessage
          ? new Date(next.lastMessage.timestamp).getTime()
          : new Date(next.createdAt).getTime();

        const prevTime = prev.lastMessage
          ? new Date(prev.lastMessage.timestamp).getTime()
          : new Date(prev.createdAt).getTime();

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
};

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
export const useChatAddMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
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
        chatId: `optimistic-${Date.now()}`,
        chatName: variables.chatName,
        createdAt: new Date().toISOString(),
        lastMessage: undefined,
        isDummy: true,
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
};

/**
 * Handles WebSocket "added_to_chat" messages
 * Updates the preview cache and navigates if needed
 *
 * @param data - data send by websocket
 */
export const useUserAddedToChat = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (data: WSUserAddedData) => {
      const { chatPreview } = data;
      // Update chat previews cache
      queryClient.setQueryData<ChatPreview[]>(["chatPreviews"], (prev = []) => {
        const withoutOptimistic = prev.filter(
          (chat) => !chat.chatId.startsWith("optimistic-"),
        );

        const exists = withoutOptimistic.some(
          (chat) => chat.chatId === chatPreview.chatId,
        );

        if (exists) {
          return withoutOptimistic.map((chat) =>
            chat.chatId === chatPreview.chatId ? chatPreview : chat,
          );
        }

        return [...withoutOptimistic, chatPreview];
      });

      return chatPreview.chatId;
    },
    [queryClient],
  );
};
