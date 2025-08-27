import { useEffect } from "react";
import ChatPreview from "../components/ChatPreview";
import "./css/chats.css";

function Chats() {
  useEffect(() => {
    async function getChats() {
      try {
        const response = await fetch("https://localhost:8000/chats", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          return;
        }
      } catch {}
    }
    getChats();
  });
  return (
    <div id="parent-div">
      <div id="top-bar">
        <h1> ChatApp </h1>
      </div>
      <div id="chats-area">
        <ChatPreview
          name="John Doe"
          message="Lorem Ipsum"
          time="22:22"
          url="/chats"
        ></ChatPreview>
      </div>
      <div id="bottom-bar"></div>
    </div>
  );
}

export default Chats;
