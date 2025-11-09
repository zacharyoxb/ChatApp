import { useNavigate } from "react-router";
import { useApi } from "./apiStates";

export const useSession = () => {
  const navigate = useNavigate();
  const api = useApi();

  const isValidSession = async () => {
    api.setLoading();

    try {
      const response = await fetch("https://localhost:8000/session", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        api.setSuccess(null);
        return true;
      }
      api.setError("Invalid session / no session exists");
    } catch {
      api.setError("Internal Server Error");
    }
    return false;
  };

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
    loading: api.isLoading,

    isValidSession,
    logout,
  };
};
