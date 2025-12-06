import { useMutation } from "@tanstack/react-query";
import type { ChatUserInfo } from "../types/chats";

export const useUserInfo = () => {
  return useMutation({
    mutationFn: async ({ username }: { username: string }) => {
      const response = await fetch(`https://localhost:8000/users/${username}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 404) {
        return null;
      }

      const userInfo: ChatUserInfo = await response.json();
      return userInfo;
    },
  });
};
