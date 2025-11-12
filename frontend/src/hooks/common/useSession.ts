import { useNavigate } from "react-router";
import { useApi } from "./apiStates";

/**
 * Custom hook for managing user authentication sessions. Uses
 * custom API hook for state management, and navigates using
 * react-router on authentication events.
 */
export const useSession = () => {
  const navigate = useNavigate();
  const authApi = useApi();

  /**
   * Validates the current user session with the server
   *
   * @remarks
   * Checks if the current session is valid by making a GET request to the session endpoint.
   *
   * This is the only function on the hook to not use api state management as error management
   * is less important here (the user doesn't need to see a visual cue for a session check
   * failing when they are on the login/signup pages)
   */
  const isValidSession = async () => {
    try {
      const response = await fetch("https://localhost:8000/session", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        return true;
      }
    } catch {}
    return false;
  };

  /**
   * Registers a new user account with the server
   *
   * @param username - The desired username for the new account
   * @param password - The password for the new account
   * @param rememberMe - Whether to persist the session beyond browser closure
   *
   * @remarks
   * On successful registration:
   * - Stores username in sessionStorage as currentUser
   * - Automatically navigates to /chats route
   *
   * On failure:
   * - Sets appropriate error message based on HTTP status code
   * - Maintains user on current page for error correction
   * - Handles common cases: username conflict (409) and server errors (500)
   */
  const signup = async (
    username: string,
    password: string,
    rememberMe: boolean
  ) => {
    authApi.setLoading();
    try {
      const response = await fetch("https://localhost:8000/signup", {
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
      }

      switch (response.status) {
        case 409:
          authApi.setError("This username is already taken. Try another.");
          break;
        case 500:
          authApi.setError(
            "Database error. Please contact website administrator."
          );
          break;
        default:
          authApi.setError(
            "Unknown error has occurred. Please contact website administrator."
          );
      }
    } catch (err) {
      authApi.setError(
        "Unknown error has occurred. Please contact website administrator."
      );
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
    authApi.setLoading();
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
          authApi.setError("Username or password is incorrect.");
          break;
        default:
          authApi.setError(
            "Unknown error has occurred. Please contact website administrator."
          );
          break;
      }
    } catch (err) {
      authApi.setError("Internal Server Error.");
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
    isLoading: authApi.isLoading,
    /** Indicates if the last operation was successful */
    isSuccess: authApi.isSuccess,
    /** Indicates if the last operation resulted in an error */
    isError: authApi.isError,

    /** Error message from the last operation, or null if no error */
    error: authApi.error,

    isValidSession,
    signup,
    login,
    logout,
    reset: authApi.reset,
  };
};
