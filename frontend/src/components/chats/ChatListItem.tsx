import React from "react";
import { useNavigate } from "react-router";
import defaultDm from "/src/assets/default-dm.png";
import defaultGroup from "/src/assets/default-group.png";
import { datetime_format } from "../../utils/formatDatetime";
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
  let date_time_string = datetime_format(lastActivity, true);
  if (isDm) {
    return `Direct chat with ${name}. Last message: ${message}. Last activity ${date_time_string}}`;
  }
  return `Group chat ${name}. Last message: ${message}. Last activity ${date_time_string}`;
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

  let image = chatImage || (isDm ? defaultDm : defaultGroup);

  return (
    <button
      className={styles.layoutDiv}
      onClick={onClick}
      tabIndex={0}
      aria-label={ARIA_LABEL_TEMPLATE(name, isDm, message, lastActivity)}
    >
      <div className={styles.leftCol}>
        <img
          className={styles.profileImage}
          src={image}
          width={50}
          height={50}
          alt={isDm ? `${name}'s profile picture` : `${name} group icon`}
        />
      </div>
      <div className={styles.rightCol}>
        <div className={styles.nameAndDate}>
          <div>{name}</div>
          <div>{datetime_format(lastActivity, false)}</div>
        </div>
        <div className={styles.message}>{message}</div>
      </div>
    </button>
  );
};

export default ChatListItem;
