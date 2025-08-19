import React from "react";
import "./css/ChatPreview.css";
import defaultProfile from "../assets/default-profile.jpg";
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
  return (
    <div id="layout-div">
      <div id="left-col">
        <img
          id="profile-image"
          src={profileImage || defaultProfile}
          width={50}
          height={50}
          alt={"${name}'s profile picture"}
        />
      </div>
      <div id="middle-col">
        <div> {name} </div>
        <div> {message} </div>
      </div>
      <div id="right-col">{time}</div>
    </div>
  );
};

export default ChatPreview;
