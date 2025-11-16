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

  // Decides which side to place dropdown on based on whether
  // the dropdown icon is placed furthest to the left or furthest
  // to the right of its parent
  useEffect(() => {
    if (showMenu && containerRef.current) {
      const dropdown = containerRef.current;
      const parent = dropdown.parentElement;
      if (parent === null) return;

      const dropdownRect = dropdown.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();

      const spaceOnRight = parentRect.right - dropdownRect.right;
      const spaceOnLeft = dropdownRect.left - parentRect.left;

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
            height={75}
            object-fit="contain"
          />
        )}
        {darkLogo && (
          <img
            src={darkLogo}
            className={styles.darkModeIcon}
            alt="Miscellaneous menu"
            height={75}
            object-fit="contain"
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
