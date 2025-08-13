import { Link, type LinkProps } from "react-router";
import React from "react";
import "./css/LinkButton.css";

interface LinkButtonProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
}

export function LinkButton({
  children,
  className = "",
  ...rest
}: LinkButtonProps) {
  return (
    <Link {...rest} className={`link-button ${className}`}>
      {children}
    </Link>
  );
}
