import React from "react";
import { useNavigate } from "react-router";
import defaultDm from "/src/assets/default-dm.png";
import defaultGroup from "/src/assets/default-group.png";
import { datetime_format } from "../../utils/formatDatetime";
import styles from "./ChatListItem.module.css";
import type { ChatMessage } from "../../hooks/chats/useChats";

interface ChatListItemProps {
  chatUrl: string;
  chatName: string;
  isDm: boolean;
  lastMessage: ChatMessage;
  chatImage?: string;
}

const ARIA_LABEL_TEMPLATE = (
  name: string,
  isDm: boolean,
  message: ChatMessage
): string => {
  let date_time_string = datetime_format(message.timestamp, true);
  if (isDm) {
    return `Direct chat with ${name}. Last message: ${message.content}. Last activity ${date_time_string}}`;
  }
  return `Group chat ${name}. Last message sent by ${message.senderUsername}: ${message.content}. Last activity ${date_time_string}`;
};

const ChatListItem: React.FC<ChatListItemProps> = ({
  chatUrl,
  chatName,
  isDm,
  lastMessage,
  chatImage,
}) => {
  const navigate = useNavigate();

  let image = chatImage || (isDm ? defaultDm : defaultGroup);

  return (
    <button
      className={styles.layoutDiv}
      onClick={() => navigate(chatUrl)}
      tabIndex={0}
      aria-label={ARIA_LABEL_TEMPLATE(chatName, isDm, lastMessage)}
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
          <div>{datetime_format(lastMessage.timestamp, false)}</div>
        </div>
        <div className={styles.message}>
          {isDm
            ? lastMessage.content
            : `${lastMessage.senderUsername}: ${lastMessage.content}`}
        </div>
      </div>
    </button>
  );
};

export default ChatListItem;
