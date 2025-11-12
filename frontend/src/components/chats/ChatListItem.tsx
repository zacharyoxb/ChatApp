import React from "react";
import { useNavigate } from "react-router";
import defaultProfile from "/src/assets/default-profile.jpg";
import {
  formatMessageTimeLong,
  formatMessageTimeShort,
} from "../../utils/formatMessageTime";
import styles from "./ChatListItem.module.css";

interface ChatListItemProps {
  chatImage?: string;
  name: string;
  isDm: boolean;
  message: string;
  lastActivity: string;
  url: string;
}

const ARIA_LABEL_TEMPLATE = (
  name: string,
  isDm: boolean,
  message: string,
  lastActivity: string
): string => {
  let [date, time] = formatMessageTimeLong(lastActivity);
  if (isDm) {
    return `Direct chat with ${name}. Last message: ${message}. Last activity ${date} at ${time}`;
  }
  return `Group chat ${name}. Last message: ${message}. Last activity ${date} at ${time}`;
};

const ChatListItem: React.FC<ChatListItemProps> = ({
  chatImage,
  name,
  isDm,
  message,
  lastActivity,
  url,
}) => {
  const navigate = useNavigate();

  function onClick() {
    navigate(url);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(url);
    }
  }

  return (
    <div className={styles.layoutDiv}>
      <div className={styles.leftCol}>
        <img
          className={styles.profileImage}
          src={chatImage || defaultProfile}
          width={50}
          height={50}
          alt={isDm ? `${name}'s profile picture` : `${name} group icon`}
        />
      </div>
      <div
        className={styles.linkContainer}
        onClick={onClick}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
        aria-label={ARIA_LABEL_TEMPLATE(name, isDm, message, lastActivity)}
      >
        <div className={styles.middleCol}>
          <div> {name} </div>
          <div> {message} </div>
        </div>
        <div className={styles.rightCol}>
          {formatMessageTimeShort(lastActivity)}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
