import React from "react";
import { useNavigate } from "react-router";
import defaultProfile from "/src/assets/default-profile.jpg";
import {
  formatMessageTimeLong,
  formatMessageTimeShort,
} from "../../utils/formatMessageTime";
import styles from "./ChatListItem.module.css";

interface ChatListItemProps {
  profileImage?: string;
  name: string;
  is_dm: boolean;
  message: string;
  last_message_at: string;
  url: string;
}

const ARIA_LABEL_TEMPLATE = (
  name: string,
  is_dm: boolean,
  message: string,
  last_message_at: string
): string => {
  let [date, time] = formatMessageTimeLong(last_message_at);
  if (is_dm) {
    return `Direct chat with ${name}. Last message: ${message}. Last activity ${date} at ${time}`;
  }
  return `Group chat ${name}. Last message: ${message}. Last activity ${date} at ${time}`;
};

const ChatListItem: React.FC<ChatListItemProps> = ({
  profileImage,
  name,
  is_dm,
  message,
  last_message_at,
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
          src={profileImage || defaultProfile}
          width={50}
          height={50}
          alt={is_dm ? `${name}'s profile picture` : `${name} group icon`}
        />
      </div>
      <div
        className={styles.linkContainer}
        onClick={onClick}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
        aria-label={ARIA_LABEL_TEMPLATE(name, is_dm, message, last_message_at)}
      >
        <div className={styles.middleCol}>
          <div> {name} </div>
          <div> {message} </div>
        </div>
        <div className={styles.rightCol}>
          {formatMessageTimeShort(last_message_at)}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
