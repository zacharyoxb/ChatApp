import React, { useEffect, useRef, useState } from "react";
import { StyledButton } from "./StyledButton";
import styles from "./Dropdown.module.css";

interface DropdownProps {
  label?: string;
  lightLogo?: string;
  darkLogo?: string;
  menuOptions: DropdownOption[];
}

export interface DropdownOption {
  label: string;
  action: () => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  lightLogo,
  darkLogo,
  menuOptions,
}) => {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<"left" | "right">("left");
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  const handleOptionClick = async (action: () => void | Promise<void>) => {
    const result = action();

    if (result instanceof Promise) {
      await result;
    }

    setShowMenu(false);
  };

  useEffect(() => {
    if (showMenu && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceOnRight = window.innerWidth - rect.right;
      const spaceOnLeft = rect.left;

      // menu aligns to side with more space
      setMenuPosition(spaceOnRight >= spaceOnLeft ? "left" : "right");
    }
  }, [showMenu]);

  return (
    <div className={styles.dropdownContainer} ref={containerRef}>
      <button className={styles.logoButton} onClick={toggleMenu}>
        {lightLogo && (
          <img
            src={lightLogo}
            className={styles.lightModeIcon}
            alt="Miscellaneous menu"
          />
        )}
        {darkLogo && (
          <img
            src={darkLogo}
            className={styles.darkModeIcon}
            alt="Miscellaneous menu"
          />
        )}
        {label}
      </button>

      {showMenu && (
        <div
          className={`${
            menuPosition === "right" ? styles.menuRight : styles.menuLeft
          } ${styles.dropdownMenu}`}
        >
          {menuOptions.map((option, index) => (
            <StyledButton
              key={index}
              className={styles.dropdownOption}
              onClick={() => handleOptionClick(option.action)}
            >
              {option.label}
            </StyledButton>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
