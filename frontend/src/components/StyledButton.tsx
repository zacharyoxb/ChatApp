import React from "react";
import styles from "./css/StyledButton.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function StyledButton({
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button {...rest} className={`${styles.styledButton} ${className}`}>
      {children}
    </button>
  );
}
