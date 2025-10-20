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

interface ChatMember {
  userId: string;
  username: string;
}

function Chats() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreviewData[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* Add member modal states */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState<ChatMember[]>([]);

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

  const handleAddMember = async (newMemberId: string) => {
    try {
      const response = await fetch("https://localhost:8000/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newMemberId }),
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

  const handleRemoveMember = (userIdToRemove: string) => {
    setMembers(members.filter((member) => member.userId !== userIdToRemove));
  };

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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Chat"
      >
        <form className={styles.entryArea} onSubmit={handleSubmit}>
          <label className={styles.labelBoxPair}>
            Chat Name:{" "}
            <input className={styles.inputBox} name="chat-name" required />
          </label>
          <div className={styles.addMemberBox}>
            <label className={styles.addMemberLabel}>
              Add Chat Members: <input name="add-member" />
              <StyledButton
                className={styles.addMemberButton}
                onClick={() => handleAddMember("CHANGE THIS")}
              >
                Add
              </StyledButton>
            </label>
            <div className={styles.userListContainer}>
              <div className={styles.userRectangle}>
                <span>You</span>
              </div>
              {members.map((member) => (
                <div key={member.userId} className={styles.userRectangle}>
                  <span> {member.username}</span>
                  <button
                    type="button"
                    className={styles.removeUserButton}
                    onClick={() => handleRemoveMember(member.userId)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <StyledButton className={styles.createChatButton} type="submit">
            Create Chat
          </StyledButton>
        </form>
      </Modal>
    </div>
  );
}

export default Chats;
