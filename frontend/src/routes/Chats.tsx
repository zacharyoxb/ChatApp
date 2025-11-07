import { useEffect, useState } from "react";
import ChatPreview from "../components/chats/ChatPreview";
import { useNavigate } from "react-router";
import threeDots from "../assets/three-dots.png";
import threeDotsLight from "../assets/three-dots-light.png";
import errorIcon from "../assets/error-icon.png";
import Dropdown, { type DropdownOption } from "../components/common/Dropdown";
import Modal from "../components/common/Modal";
import { StyledButton } from "../components/common/StyledButton";
import styles from "./Chats.module.css";

interface ChatPreviewData {
  chat_id: number;
  chat_name: string;
  last_message_at: string; // ISO datetime format
}

function Chats() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreviewData[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* Add member modal states */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberEntryBox, setMemberEntryBox] = useState<string>("");
  const [memberError, setMemberError] = useState<string | null>(null);
  const [members, setMembers] = useState<string[]>([]);

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
        sessionStorage.removeItem("currentUser");
        navigate("/");
      },
    },
  ];

  const handleAddMember = async (newMember: string) => {
    // The user has entered nothing
    if (!newMember) {
      setMemberError(`Please enter a username.`);
      return;
    }

    // The user has entered their own username
    if (sessionStorage.getItem("currentUser") === newMember) {
      setMemberError(`You have entered your own username.`);
      return;
    }
    // User is already a member
    if (members.includes(newMember)) {
      setMemberError(
        `User "${newMember} is already in the group of users to be added.`
      );
      return;
    }

    try {
      const response = await fetch(
        `https://localhost:8000/users/${newMember}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      // User doesn't exist
      if (response.status === 404) {
        setMemberError(`User "${newMember}" does not exist.`);
        return;
      }

      // Add member, remove errors
      if (response.ok) {
        setMemberError(null);
        setMembers((prevMembers) => [...prevMembers, newMember]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleRemoveMember = (usernameToRemove: string) => {
    setMembers(
      members.filter((memberUsername) => memberUsername !== usernameToRemove)
    );
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
        onClose={() => {
          setMemberError(null);
          setIsModalOpen(false);
        }}
        title="Create New Chat"
      >
        <form className={styles.entryArea} onSubmit={handleSubmit}>
          <label className={styles.labelBoxPair}>
            Chat Name:{" "}
            <input className={styles.inputBox} name="chat-name" required />
          </label>
          <div className={styles.addMemberBox}>
            <label className={styles.addMemberLabel}>
              Add Chat Members:{" "}
              <div className={styles.inputContainer}>
                <input
                  name="add-member"
                  onInput={(e) => setMemberEntryBox(e.currentTarget.value)}
                />
                {memberError && (
                  <div className={styles.errorTooltip}>
                    <img
                      src={errorIcon}
                      alt="Error icon"
                      width={25}
                      height={25}
                    />
                    <div className={styles.tooltip}>{memberError}</div>
                  </div>
                )}
              </div>
              <StyledButton
                type="button"
                className={styles.addMemberButton}
                onClick={() => handleAddMember(memberEntryBox)}
              >
                Add
              </StyledButton>
            </label>
            <div className={styles.userListContainer}>
              <div className={styles.userRectangle}>
                <span>You</span>
              </div>
              {members.map((member) => (
                <div key={member} className={styles.userRectangle}>
                  <span> {member}</span>
                  <button
                    type="button"
                    className={styles.removeUserButton}
                    onClick={() => handleRemoveMember(member)}
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
