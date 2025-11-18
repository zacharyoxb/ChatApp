import { useCallback, useState } from "react";

/**
 * Represents the possible states of an API request
 */
export type ApiState = "IDLE" | "LOADING" | "SUCCESS" | "ERROR";

/**
 * Interface representing the complete API response state
 *
 * @template T - The type of data returned on success
 */
export interface ApiResponse<T> {
  /** The data returned from a successful API call, or null if not available */
  data: T | null;
  /** The current state of the API request */
  state: ApiState;
  /** Error message if the request failed, empty string otherwise */
  error: string;
}

/**
 * Custom hook for managing API request states
 *
 * @remarks
 * Provides a centralized way to handle loading, success, error states,
 * and data management for API operations. Includes convenience boolean
 * properties for common state checks.
 *
 * @template T - The type of data returned on successful API calls
 */
export const useApi = <T>() => {
  const [response, setResponse] = useState<ApiResponse<T>>({
    data: null,
    state: "IDLE",
    error: "",
  });

  /**
   * Sets the API state to LOADING
   *
   * @remarks
   * Resets any previous error message and indicates that a request is in progress
   */
  const setLoading = useCallback(() => {
    setResponse((prev) => ({ ...prev, state: "LOADING", error: "" }));
  }, []);

  /**
   * Sets the API state to SUCCESS with the provided data
   *
   * @param data - The successful response data to store, or a function that receives previous data and returns new data
   */
  const setSuccess = useCallback((data: T | ((prevData: T | null) => T)) => {
    setResponse((prev) => {
      const newData =
        typeof data === "function"
          ? (data as (prevData: T | null) => T)(prev.data)
          : data;

      return {
        data: newData,
        state: "SUCCESS",
        error: "",
      };
    });
  }, []);

  /**
   * Sets the API state to ERROR with the provided error message
   *
   * @param error - The error message to display
   */
  const setError = useCallback((error: string) => {
    setResponse((prev) => ({
      ...prev,
      state: "ERROR",
      error,
    }));
  }, []);

  return {
    /** The current data from successful API calls, or null */
    data: response.data,
    /** The current API state */
    state: response.state,
    /** Current error message, or empty string if no error */
    error: response.error,

    setLoading,
    setSuccess,
    setError,

    /** Convenience boolean indicating if the API is in LOADING state */
    isLoading: response.state === "LOADING",
    /** Convenience boolean indicating if the API is in SUCCESS state */
    isSuccess: response.state === "SUCCESS",
    /** Convenience boolean indicating if the API is in ERROR state */
    isError: response.state === "ERROR",
  };
};
