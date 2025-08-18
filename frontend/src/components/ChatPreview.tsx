import React from "react";
import "./css/ChatPreview.css";
import { Link } from "react-router";

interface ChatPreviewProps {
  profileImage?: string;
  name: string;
  message: string;
  time: string;
  url: string;
}

// make focusable later for accessibility
const ChatPreview: React.FC<ChatPreviewProps> = ({
  profileImage,
  name,
  message,
  time,
  url,
}) => {
  const defaultProfile = "/images/default/default-profile.png";

  return (
    <Link to={url} id="layout-div">
      <div className="left-col">
        <img
          id="profile-image"
          src={profileImage || defaultProfile}
          alt={name + "'s profile picture"}
        />
        <div className="middle-col">{message}</div>

        <div className="right-col">{time}</div>
      </div>
    </Link>
  );
};

export default ChatPreview;
