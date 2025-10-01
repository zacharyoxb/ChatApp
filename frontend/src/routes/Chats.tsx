import { useEffect, useState } from "react";
import ChatPreview from "../components/ChatPreview";
import { useNavigate } from "react-router";
import threeDots from "../assets/three-dots.png";
import threeDotsLight from "../assets/three-dots-light.png";
import Dropdown, { type DropdownOption } from "../components/Dropdown";
import Modal from "../components/Modal";
import { StyledButton } from "../components/StyledButton";
import styles from "./css/Chats.module.css";

interface ChatPreviewData {
  chat_id: number;
  chat_name: string;
  last_message_at: string; // ISO datetime format
}

function Chats() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreviewData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchChats();
  }, []);

  const dropdownOptions: DropdownOption[] = [
    {
      label: "Create Chat",
      action: () => setIsModalOpen(true),
    },
    {
      label: "Logout",
      action: async () => {
        await fetch("https://localhost:8000/logout", {
          method: "POST",
          credentials: "include",
        });
        navigate("/");
      },
    },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const chatName = formData.get("chat-name") as string;
    try {
      const response = await fetch("https://localhost:8000/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatName }),
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Chat"
      >
        <form className={styles.entryArea} onSubmit={handleSubmit}>
          <label>
            Chat Name:{" "}
            <input className={styles.inputBox} name="chat-name" required />
          </label>
          {error && <div className="error-box">{error}</div>}

          <StyledButton className={styles.createChatButton} type="submit">
            Create Chat
          </StyledButton>
        </form>
      </Modal>
    </div>
  );
}

export default Chats;
