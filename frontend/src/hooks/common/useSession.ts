import { useNavigate } from "react-router";
import { useApi } from "./apiStates";

/**
 * Custom hook for managing user authentication sessions. Uses
 * custom API hook for state management, and navigates using
 * react-router on authentication events.
 */
export const useSession = () => {
  const navigate = useNavigate();
  const api = useApi();

  /**
   * Validates the current user session with the server
   *
   * @remarks
   * Checks if the current session is valid by making a GET request to the session endpoint.
   * Updates the API state accordingly but does not return a value - check state properties for results.
   */
  const isValidSession = async () => {
    api.setLoading();
    try {
      const response = await fetch("https://localhost:8000/session", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        api.setSuccess(null);
        return;
      }
      api.setError("Invalid session / no session exists");
    } catch {
      api.setError("Internal Server Error");
    }
  };

  /**
   * * Authenticates a user with the server
   *
   * @param username - The user's username
   * @param password - The user's password
   * @param rememberMe - Whether to persist the session
   *
   * @remarks
   * On successful authentication:
   * - Stores username in sessionStorage
   * - Automatically navigates to /chats
   *
   * On failure:
   * - Sets appropriate error message based on HTTP status
   * - Maintains user on current page for error handling
   */
  const login = async (
    username: string,
    password: string,
    rememberMe: boolean
  ) => {
    api.setLoading();
    try {
      const response = await fetch("https://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, rememberMe }),
        credentials: "include",
      });

      if (response.ok) {
        sessionStorage.setItem("currentUser", username);
        navigate("/chats");
        return;
      }

      switch (response.status) {
        case 401:
          api.setError("Username or password is incorrect.");
          break;
        default:
          api.setError(
            "Unknown error has occurred. Please contact website administrator."
          );
          break;
      }
    } catch (err) {
      api.setError("Internal Server Error.");
    }
  };

  /**
   * Terminates the current user session
   *
   * @remarks
   * - Calls server logout endpoint
   * - Removes user data from sessionStorage
   * - Navigates to home page (/)
   * - Silently handles network errors
   */
  const logout = async () => {
    try {
      await fetch("https://localhost:8000/logout", {
        method: "POST",
        credentials: "include",
      });
      sessionStorage.removeItem("currentUser");
      navigate("/");
    } catch (error) {}
  };

  return {
    /** Indicates if an authentication request is in progress */
    isLoading: api.isLoading,
    /** Indicates if the last operation was successful */
    isSuccess: api.isSuccess,
    /** Indicates if the last operation resulted in an error */
    isError: api.isError,

    /** Error message from the last operation, or null if no error */
    error: api.error,

    isValidSession,
    login,
    logout,
  };
};
