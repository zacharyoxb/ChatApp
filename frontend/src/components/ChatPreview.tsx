import React from "react";
import { useNavigate } from "react-router";
import defaultProfile from "../assets/default-profile.jpg";
import "./css/ChatPreview.css";
import {
  formatMessageTimeLong,
  formatMessageTimeShort,
} from "../utils/formatMessageTime";

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
    <div id="layout-div">
      <div id="left-col">
        <img
          id="profile-image"
          src={profileImage || defaultProfile}
          width={50}
          height={50}
          alt={`${name}'s profile picture`}
        />
      </div>
      <div
        id="link-container"
        onClick={onClick}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Chat with ${name}. Last message: ${message}. Sent/Received ${date} at ${time}`}
      >
        <div id="middle-col">
          <div> {name} </div>
          <div> {message} </div>
        </div>
        <div id="right-col">{formatMessageTimeShort(last_message_at)}</div>
      </div>
    </div>
  );
};

export default ChatPreview;
