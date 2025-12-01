import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import type {
  ChatPreview,
  UserInfo,
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
          return null;
        } else {
          navigate("/login", { state: { noCookie: true } });
          return null;
        }
      }

      const data: ChatPreview[] = await response.json();
      return data;
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

      // Only return success confirmation, not chat data
      return { success: true };
    },

    // OPTIMISTIC UPDATE: Immediately show the chat in UI
    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["chatPreviews"] });

      // Snapshot the previous value
      const previousChats =
        queryClient.getQueryData<ChatPreview[]>(["chatPreviews"]) || [];

      // Generate optimistic chat preview
      const optimisticChat: ChatPreview = {
        chatId: `optimistic-${Date.now()}`, // Temporary ID
        chatName: variables.chatName,
        createdAt: new Date().toISOString(),
        lastMessage: undefined,
      };

      // Optimistically update to the new value
      queryClient.setQueryData<ChatPreview[]>(
        ["chatPreviews"],
        [...previousChats, optimisticChat]
      );

      // Return context with the optimistic chat for potential rollback
      return {
        optimisticChat,
        previousChats,
      };
    },

    // SUCCESS: POST succeeded, wait for WebSocket confirmation
    onSuccess: () => {},

    // ERROR: Rollback the optimistic update
    onError: (error: Error, variables, context) => {
      void variables; // hide warning
      console.error("Failed to create chat:", error.message);

      // Rollback to previous state
      if (context?.previousChats) {
        queryClient.setQueryData(["chatPreviews"], context.previousChats);
      }
    },

    // SETTLED: Invalidates to ensure fresh data (after WS should have arrived)
    onSettled: () => {
      // Optionally refetch after a delay to catch any missed WS updates
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
   * @param data - data send by websocket
   */
  const handleUserAddedToChat = useCallback(
    (data: WSUserAddedData) => {
      const { chatPreview } = data;

      // Update chat previews cache
      queryClient.setQueryData<ChatPreview[]>(["chatPreviews"], (prev = []) => {
        const withoutOptimistic = prev.filter(
          (chat) => !chat.chatId.startsWith("optimistic-")
        );

        const exists = withoutOptimistic.some(
          (chat) => chat.chatId === chatPreview.chatId
        );

        if (exists) {
          return withoutOptimistic.map((chat) =>
            chat.chatId === chatPreview.chatId ? chatPreview : chat
          );
        }

        return [...withoutOptimistic, chatPreview];
      });

      return chatPreview.chatId;
    },
    [queryClient, navigate]
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
    /** Function that handles WS notification of the user being added to a chat */
    handleUserAddedToChat,
    /** Updates the last message sent */
    updateLastMessage,
    /** Chats sorted by most recent activity in descending order */
    sortedChatPreviews,
  };
};
