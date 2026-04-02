// queries/authQueries.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { UserSession } from "../types/session";

// Allows auth to be disabled
type useAuthSessionOptions = {
  enabled?: boolean;
};

interface AuthResult {
  data: UserSession | null;
  isAuthenticated: boolean;
  error?: string;
}

export const useAuthSession = (options?: useAuthSessionOptions) => {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<AuthResult> => {
      const response = await fetch("https://localhost:8000/session", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data: UserSession = await response.json();
        return {
          data,
          isAuthenticated: true,
        };
      }

      if (response.status === 401) {
        const errData = await response.json();
        return {
          data: null,
          isAuthenticated: false,
          error: errData.detail,
        };
      }

      throw new Error(`Server error: ${response.status}`);
    },
    retry: false,
    staleTime: Infinity,
    enabled,
  });
};

export const useSignup = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      password,
      rememberMe,
    }: {
      username: string;
      password: string;
      rememberMe: boolean;
    }) => {
      const response = await fetch("https://localhost:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
        credentials: "include",
      });

      if (!response.ok) {
        switch (response.status) {
          case 409:
            throw new Error("This username is already taken. Try another.");
          case 500:
            throw new Error(
              "Database error. Please contact website administrator.",
            );
          default:
            throw new Error("Unknown error has occurred.");
        }
      }
      return response;
    },
    onSuccess: async (_response, _variables) => {
      // force refetch so when session is validated the user has a cookie
      await queryClient.invalidateQueries({ queryKey: ["session"] });

      navigate("/chats");
    },
  });
};

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      password,
      rememberMe,
    }: {
      username: string;
      password: string;
      rememberMe: boolean;
    }) => {
      const response = await fetch("https://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "username": username, "password": password, "remember_me": rememberMe }),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Username or password is incorrect.");
        }
        throw new Error("Unknown error has occurred.");
      }
      return response;
    },
    onSuccess: async (_response, _variables) => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });

      navigate("/chats");
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return fetch("https://localhost:8000/logout", {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });

      navigate("/");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });

      navigate("/");
    },
  });
};
