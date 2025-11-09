import { useCallback, useState } from "react";

export type ApiState = "IDLE" | "LOADING" | "SUCCESS" | "ERROR";

export interface ApiResponse<T> {
  data: T | null;
  state: ApiState;
  error: string;
}

/**
 * Allows simple management of API state.
 */
export const useApi = <T>() => {
  const [response, setResponse] = useState<ApiResponse<T>>({
    data: null,
    state: "IDLE",
    error: "",
  });

  const setLoading = useCallback(() => {
    setResponse((prev) => ({ ...prev, state: "LOADING", error: "" }));
  }, []);

  const setSuccess = useCallback((data: T) => {
    setResponse({
      data,
      state: "SUCCESS",
      error: "",
    });
  }, []);

  const setError = useCallback((error: string) => {
    setResponse((prev) => ({
      ...prev,
      state: "ERROR",
      error,
    }));
  }, []);

  const reset = useCallback(() => {
    setResponse({
      data: null,
      state: "IDLE",
      error: "",
    });
  }, []);

  return {
    // State
    ...response,

    // Actions
    setLoading,
    setSuccess,
    setError,
    reset,

    // Convenience properties
    isLoading: response.state === "LOADING",
    isSuccess: response.state === "SUCCESS",
    isError: response.state === "ERROR",
    isIdle: response.state === "IDLE",
  };
};
