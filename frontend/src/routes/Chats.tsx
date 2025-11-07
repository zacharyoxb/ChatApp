import { useEffect, useState } from "react";
import ChatPreview from "../components/chats/ChatPreview";
import { useNavigate } from "react-router";
import threeDots from "../assets/three-dots.png";
import threeDotsLight from "../assets/three-dots-light.png";
import Dropdown, { type DropdownOption } from "../components/common/Dropdown";
import styles from "./Chats.module.css";
import { useModal } from "../hooks/common/useModal";
import CreateChatModal from "../components/chats/CreateChatModal";

interface ChatPreviewData {
  chat_id: number;
  chat_name: string;
  last_message_at: string; // ISO datetime format
}

function Chats() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreviewData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const createChatModal = useModal();

  async function fetchChats() {
    try {
      const response = await fetch("https://localhost:8000/chats", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/login", {
          state: {
            sessionExpired: true,
          },
        });
      }

      if (response.ok) {
        const data: ChatPreviewData[] = await response.json();
        setChats(data);
      }
    } catch {}
  }

  useEffect(() => {
    fetchChats();
  }, []);

  const dropdownOptions: DropdownOption[] = [
    {
      label: "Create Chat",
      action: createChatModal.open,
    },
    {
      label: "Logout",
      action: async () => {
        await fetch("https://localhost:8000/logout", {
          method: "POST",
          credentials: "include",
        });
        sessionStorage.removeItem("currentUser");
        navigate("/");
      },
    },
  ];

  const handleCreateChat = async (chatName: string, members: string[]) => {
    try {
      const response = await fetch("https://localhost:8000/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatName, members }),
        credentials: "include",
      });

      if (response.status !== 201) {
        setError("Error occurred when creating chat.");
        return;
      }

      fetchChats();
    } catch (err) {
      setError("Internal Server Error.");
    }
  };

  return (
    <div className={styles.parentDiv}>
      <div className={styles.topBar}>
        <h1> ChatApp </h1>
        {error && (
          <div
            className="error-box"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            {error}
          </div>
        )}
        <Dropdown
          darkLogo={threeDots}
          lightLogo={threeDotsLight}
          menuOptions={dropdownOptions}
        ></Dropdown>
      </div>
      <div className={styles.chatsArea}>
        {chats.length === 0 ? (
          <h2> You aren't in any chats. </h2>
        ) : (
          chats.map((chat) => (
            <ChatPreview
              key={chat.chat_id}
              name={chat.chat_name}
              message="Lorem Ipsum"
              last_message_at={chat.last_message_at}
              url="/chats"
            ></ChatPreview>
          ))
        )}
      </div>
      <div className={styles.bottomBar}></div>
      <CreateChatModal
        isOpen={createChatModal.isOpen}
        onClose={createChatModal.close}
        onCreateChat={handleCreateChat}
      ></CreateChatModal>
    </div>
  );
}

export default Chats;
