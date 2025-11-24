import React from "react";
import { useNavigate } from "react-router";
import defaultDm from "/src/assets/default-dm.png";
import defaultGroup from "/src/assets/default-group.png";
import { datetime_format } from "../../../utils/formatDatetime";
import styles from "./ChatListItem.module.css";
import type { ChatMessage } from "../../../hooks/chats/useChats";

interface ChatListItemProps {
  chatUrl: string;
  chatName: string;
  createdAt: string;
  isDm: boolean;
  lastMessage?: ChatMessage;
  chatImage?: string;
}

const ARIA_LABEL_TEMPLATE = (
  name: string,
  createdAt: string,
  isDm: boolean,
  message?: ChatMessage
): string => {
  // If no messages yet
  if (!message) {
    let date_time_string = datetime_format(createdAt, true);
    if (isDm) {
      return `Direct chat with ${name}. No messages yet. Last activity ${date_time_string}`;
    }
    return `Group chat ${name}. No messages yet. Last activity ${date_time_string}`;
  }

  // Otherwise:
  let date_time_string = datetime_format(message.timestamp, true);
  if (isDm) {
    return `Direct chat with ${name}. Last message: ${message.content}. Last activity ${date_time_string}}`;
  }
  return `Group chat ${name}. Last message sent by ${message.senderUsername}: ${message.content}. Last activity ${date_time_string}`;
};

const ChatListItem: React.FC<ChatListItemProps> = ({
  chatUrl,
  chatName,
  createdAt,
  isDm,
  lastMessage,
  chatImage,
}) => {
  const navigate = useNavigate();

  const image = chatImage || (isDm ? defaultDm : defaultGroup);
  const aria_label = ARIA_LABEL_TEMPLATE(
    chatName,
    createdAt,
    isDm,
    lastMessage
  );

  let messagePreview;
  if (isDm) {
    messagePreview = lastMessage ? lastMessage.content : "No messages yet.";
  } else {
    messagePreview = lastMessage
      ? `${lastMessage.senderUsername}: ${lastMessage.content}`
      : "No messages yet.";
  }

  return (
    <button
      className={styles.layoutDiv}
      onClick={() => navigate(chatUrl)}
      tabIndex={0}
      aria-label={aria_label}
    >
      <div className={styles.leftCol}>
        <img
          className={styles.profileImage}
          src={image}
          width={50}
          height={50}
          alt={
            isDm ? `${chatName}'s profile picture` : `${chatName} group icon`
          }
        />
      </div>
      <div className={styles.rightCol}>
        <div className={styles.nameAndDate}>
          <div>{chatName}</div>
          <div>
            {datetime_format(
              lastMessage ? lastMessage.timestamp : createdAt,
              false
            )}
          </div>
        </div>
        <div className={styles.message}>{messagePreview}</div>
      </div>
    </button>
  );
};

export default ChatListItem;
