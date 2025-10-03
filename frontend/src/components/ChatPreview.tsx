import React from "react";
import { useNavigate } from "react-router";
import defaultProfile from "../assets/default-profile.jpg";
import {
  formatMessageTimeLong,
  formatMessageTimeShort,
} from "../utils/formatMessageTime";
import styles from "./css/ChatPreview.module.css";

interface ChatPreviewProps {
  profileImage?: string;
  name: string;
  message: string;
  last_message_at: string;
  url: string;
}

const ChatPreview: React.FC<ChatPreviewProps> = ({
  profileImage,
  name,
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

  const [date, time] = formatMessageTimeLong(last_message_at);

  return (
    <div className={styles.layoutDiv}>
      <div className={styles.leftCol}>
        <img
          className={styles.profileImage}
          src={profileImage || defaultProfile}
          width={50}
          height={50}
          alt={`${name}'s profile picture`}
        />
      </div>
      <div
        className={styles.linkContainer}
        onClick={onClick}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Chat with ${name}. Last message: ${message}. Sent/Received ${date} at ${time}`}
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

export default ChatPreview;
