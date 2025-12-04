import { useCallback } from "react";
import type { UserInfo } from "../../types/chats";
import { useQuery } from "@tanstack/react-query";

export const useUserInfo = (username: string) => {
  const userQuery = useQuery({queryKey: ['userInfo', username], queryFn: async () => {
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

      const userInfo: UserInfo = await response.json();
      return userInfo;
  }})
  /** Fetches UserInfo from backend for a specific user.
   *
   * @param username - Username to get userinfo for
   *
   * @returns userInfo for user.
   */
  const fetchUserInfo = useCallback(async (username: string) => {
    try {
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

      const userInfo: UserInfo = await response.json();
      return userInfo;
    } catch (err) {
      console.log(err);
    }
    return null;
  }, []);

  return {
    /** Function to fetch user info for a specific user */
    fetchUserInfo,
    userQuery,
  };
};
