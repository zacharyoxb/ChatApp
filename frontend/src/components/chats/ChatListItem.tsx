import React from "react";
import { useNavigate } from "react-router";
import defaultDm from "/src/assets/default-dm.png";
import defaultGroup from "/src/assets/default-group.png";
import { datetime_format } from "../../utils/formatDatetime";
import styles from "./ChatListItem.module.css";
import type { Message } from "../../hooks/chats/useChats";

interface ChatListItemProps {
  chatImage?: string;
  name: string;
  isDm: boolean;
  lastMessage: Message;
  url: string;
}

const ARIA_LABEL_TEMPLATE = (
  name: string,
  isDm: boolean,
  message: Message
): string => {
  let date_time_string = datetime_format(message.timestamp, true);
  if (isDm) {
    return `Direct chat with ${name}. Last message: ${message.content}. Last activity ${date_time_string}}`;
  }
  return `Group chat ${name}. Last message sent by ${message.senderId}: ${message.content}. Last activity ${date_time_string}`;
};

const ChatListItem: React.FC<ChatListItemProps> = ({
  chatImage,
  name,
  isDm,
  lastMessage,
  url,
}) => {
  const navigate = useNavigate();

  let image = chatImage || (isDm ? defaultDm : defaultGroup);

  return (
    <button
      className={styles.layoutDiv}
      onClick={() => navigate(url)}
      tabIndex={0}
      aria-label={ARIA_LABEL_TEMPLATE(name, isDm, lastMessage)}
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
          <div>{datetime_format(lastMessage.timestamp, false)}</div>
        </div>
        <div className={styles.message}>
          {isDm
            ? lastMessage.content
            : `${lastMessage.senderId}: ${lastMessage.content}`}
        </div>
      </div>
    </button>
  );
};

export default ChatListItem;
