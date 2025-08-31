import React, { useState } from "react";
import { useNavigate } from "react-router";
import "./css/Dropdown.css";

interface DropdownProps {
  label?: string;
  lightLogo?: string;
  darkLogo?: string;
  menuOptions: DropdownOption[];
}

export interface DropdownOption {
  label: string;
  url: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  lightLogo,
  darkLogo,
  menuOptions,
}) => {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  const handleOptionClick = (url: string) => {
    navigate(url);
    setShowMenu(false);
  };

  return (
    <div id="dropdown-container">
      <button id="button" onClick={toggleMenu}>
        {lightLogo && (
          <img
            src={lightLogo}
            id="light-mode-icon"
            width={50}
            height={50}
            alt="dropdown"
          />
        )}
        {darkLogo && (
          <img
            src={darkLogo}
            id="dark-mode-icon"
            width={50}
            height={50}
            alt="dropdown"
          />
        )}
        {label}
      </button>

      {showMenu && (
        <div id="dropdown-menu">
          {menuOptions.map((option, index) => (
            <button
              key={index}
              id="dropdown-option"
              onClick={() => handleOptionClick(option.url)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
