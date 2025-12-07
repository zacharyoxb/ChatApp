import { useQueryClient } from "@tanstack/react-query";
import type { ChatUserInfo } from "../types/chats";

const fetchUser = async (username: string) => {
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

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  return response.json() as Promise<ChatUserInfo>;
};

export const useUserInfo = () => {
  const queryClient = useQueryClient();

  // Fetch and cache a user
  const getUser = async (username: string) => {
    return queryClient.fetchQuery({
      queryKey: ["user", username],
      queryFn: () => fetchUser(username),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
  };

  // Get already cached user (no fetch)
  const getCachedUser = (username: string) => {
    return queryClient.getQueryData<ChatUserInfo | null>(["user", username]);
  };

  return {
    getUser,
    getCachedUser,
  };
};
