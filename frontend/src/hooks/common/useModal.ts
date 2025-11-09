import { useState } from "react";

/**
 * Custom hook for modal state management
 * @param initialState - Initial open/closed state (default: false)
 * @returns Object with isOpen state and control methods
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
