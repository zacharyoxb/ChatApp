import React from "react";
import "./css/CustomButton.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function CustomButton({
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button {...rest} className={`custom-button ${className}`}>
      {children}
    </button>
  );
}
