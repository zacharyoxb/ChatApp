import { useEffect, useState } from "react";
import ChatPreview from "../components/ChatPreview";
import { useNavigate } from "react-router";
import "./css/chats.css";

interface ChatPreviewData {
  chat_id: number;
  chat_name: string;
}

function Chats() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreviewData[]>([]);

  useEffect(() => {
    async function fetchChats() {
      try {
        const response = await fetch("https://localhost:8000/chats", {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
          navigate("/login");
        }

        if (response.ok) {
          const data: ChatPreviewData[] = await response.json();
          setChats(data);
        }
      } catch {}
    }
    fetchChats();
  }, []);
  return (
    <div id="parent-div">
      <div id="top-bar">
        <h1> ChatApp </h1>
      </div>
      <div id="chats-area">
        {chats.length === 0 ? (
          <h2> You aren't in any chats. </h2>
        ) : (
          chats.map((chat) => (
            <ChatPreview
              key={chat.chat_id}
              name={chat.chat_name}
              message="Lorem Ipsum"
              time="22:22"
              url="/chats"
            ></ChatPreview>
          ))
        )}
      </div>
      <div id="bottom-bar"></div>
    </div>
  );
}

export default Chats;
