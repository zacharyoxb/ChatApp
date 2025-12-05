import { useCallback } from "react";
import type { ChatUserInfo } from "../../types/chats";

export const useUserInfo = () => {
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

      const userInfo: ChatUserInfo = await response.json();
      return userInfo;
    } catch (err) {
      console.log(err);
    }
    return null;
  }, []);

  return {
    /** Function to fetch user info for a specific user */
    fetchUserInfo,
  };
};
