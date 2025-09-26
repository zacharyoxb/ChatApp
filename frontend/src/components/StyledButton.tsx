import React from "react";
import "./css/StyledButton.css";

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
    <button {...rest} className={`styled-button ${className}`}>
      {children}
    </button>
  );
}
