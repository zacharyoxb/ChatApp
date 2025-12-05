import { useCallback } from "react";
import type {
  ChatDetails,
  ChatMessage,
  WSChatMessageData,
} from "../../types/chats";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useChatDetails = (chatId: string | undefined) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchDetails = useQuery({
    queryKey: ["chatDetails", chatId],
    queryFn: async () => {
      const response = await fetch(`https://localhost:8000/chats/${chatId}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.detail === "SESSION_EXPIRED") {
          navigate("/login", { state: { sessionExpired: true } });
        } else {
          navigate("/login", { state: { noCookie: true } });
        }
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data: ChatDetails = await response.json();
      
      const sortedMessages = (data.messages || []).sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB
      });
      
      return {
        ...data,
        messages: sortedMessages, 
      };
    },
    enabled: !!chatId,
  });

  /**
   * Adds a websocket message to chatDetails' history
   *
   * @param data - message data sent from backend via ws
   */
  const addMessage = useCallback(
    (messageData: WSChatMessageData) => {
      queryClient.setQueryData(
        ["chatDetails", messageData.chatId],
        (prev: ChatDetails | undefined) => {
          if (!prev) return prev;

          const sender = prev.participants.find(
            (user) => user.userId == messageData.message.senderId
          );

          const messageWithSender = {
            ...messageData.message,
            senderUsername: sender?.username || "UNKNOWN",
          };

          return {
            ...prev,
            messages: [...prev.messages, messageWithSender],
          };
        }
      );
    },
    [queryClient]
  );

  /**
   * Adds a list of ChatMessages to ChatDetails
   *
   * @param chatId - Id of chat which message is from
   * @param newMessages - List of messages to add
   */
  const addMessages = useCallback(
    (chatId: string, newMessages: ChatMessage[]) => {
      queryClient.setQueryData(
        ["chatDetails", chatId],
        (old: ChatDetails | undefined) => {
          if (!old) return old;

          return {
            ...old,
            messages: [...old.messages, ...newMessages],
          };
        }
      );
    },
    [queryClient]
  );

  return {
    /** Array of chat details, empty array if no chats are loaded */
    data: fetchDetails.data,
    /** Error message from the last failed chat preview operation, null if no error */
    error: fetchDetails.error,
    /** Function to add a message to chat */
    addMessage,
    /** Function to add several messages to chat */
    addMessages,
  };
};
