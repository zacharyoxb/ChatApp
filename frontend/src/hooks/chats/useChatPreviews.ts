import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useApi } from "../common/apiStates";
import type { ChatPreview, UserInfo } from "../../types/chats";

export const useChatPreviews = () => {
  const navigate = useNavigate();
  const chatPreviewApi = useApi<ChatPreview[]>();

  /**
   * Fetches all chats that the current user is participating in
   *
   * @remarks
   * Automatically handles session expiration by redirecting to login page.
   * Updates the chat list state with fetched data on success.
   */
  const fetchChatPreviews = useCallback(async () => {
    chatPreviewApi.setLoading();

    try {
      const response = await fetch("https://localhost:8000/chats/my-chats", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.detail === "SESSION_EXPIRED") {
          navigate("/login", { state: { sessionExpired: true } });
        } else {
          navigate("/login", { state: { noCookie: true } });
          return;
        }
      }

      if (response.ok) {
        const data: ChatPreview[] = await response.json();
        chatPreviewApi.setSuccess(data);
      } else {
        chatPreviewApi.setError("Failed to fetch chats");
      }
    } catch (err) {
      chatPreviewApi.setError("Internal Server Error");
    }
  }, [chatPreviewApi.data, navigate]);

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
    async (
      chatName: string,
      otherUsers: UserInfo[],
      isPublic: boolean,
      ws: WebSocket
    ) => {
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
          chatPreviewApi.setError("Error occurred when creating chat.");
          return;
        }

        const newChat: ChatPreview = await response.json();

        chatPreviewApi.setSuccess((prev) => {
          const safePrev = prev || [];
          const updatedChatPreviews = [...safePrev, newChat];
          return updatedChatPreviews;
        });

        ws.send(
          JSON.stringify({
            type: "subscribe",
            chatId: newChat.chatId,
          })
        );

        navigate(`/chats/${newChat.chatId}`);
      } catch (err) {
        chatPreviewApi.setError("Internal Server Error.");
      }
    },
    [chatPreviewApi]
  );

  /** Sorts chat previews by timestamp of last message
   *
   * @remarks
   * Order of chats
   * 1. Most recently created chats with no messages (i.e. those
   *    that appear latest in the list)
   */
  const sortedChatPreviews = useMemo(() => {
    return (chatPreviewApi.data || []).sort((prev, next) => {
      const nextTime = next.lastMessage
        ? next.lastMessage.timestamp
        : next.createdAt;
      const prevTime = prev.lastMessage
        ? prev.lastMessage.timestamp
        : prev.createdAt;

      return new Date(nextTime).getTime() - new Date(prevTime).getTime();
    });
  }, [chatPreviewApi.data]);

  return {
    data: chatPreviewApi.data || [],
    isLoading: chatPreviewApi.isLoading,
    error: chatPreviewApi.isError,

    fetchChatPreviews,
    createChat,
    sortedChatPreviews,
  };
};
