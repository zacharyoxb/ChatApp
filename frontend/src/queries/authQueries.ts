// queries/authQueries.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { UserSession } from "../types/session";

// Allows auth to be disabled
type useAuthSessionOptions = {
    enabled?: boolean;
}

interface AuthResult {
  data: UserSession | null;
  isAuthenticated: boolean;
  error?: string;
}

export const useAuthSession = (options?: useAuthSessionOptions) => {
    const {
        enabled = true
    } = options || {}

  return useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<AuthResult> => {
        const response = await fetch("https://localhost:8000/session", {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
            const data = await response.json();
            return {
                data,
                isAuthenticated: true,
            }
        } 
       
        if (response.status === 401) {
            const errData = await response.json()
            return {
                data: null,
                isAuthenticated: false,
                error: errData.detail,
            }
        }

        throw new Error(`Server error: ${response.status}`)
    },
    retry: false,
    staleTime: Infinity,
    enabled,
  });
};

export const useSignup = () => {
  const navigate = useNavigate();
  
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
            throw new Error("Database error. Please contact website administrator.");
          default:
            throw new Error("Unknown error has occurred.");
        }
      }
      return response;
    },
    onSuccess: (_response, variables) => {
      sessionStorage.setItem("currentUser", variables.username);
      navigate("/chats");
    },
  });
};

export const useLogin = () => {
  const navigate = useNavigate();
  
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
        body: JSON.stringify({ username, password, rememberMe }),
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
    onSuccess: (_response, variables) => {
      sessionStorage.setItem("currentUser", variables.username);
      navigate("/chats");
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async () => {
      return fetch("https://localhost:8000/logout", {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      sessionStorage.removeItem("currentUser");
      navigate("/");
    },
    onSettled: () => {
      // Clear local state even if request fails
      sessionStorage.removeItem("currentUser");
      navigate("/");
    },
  });
};