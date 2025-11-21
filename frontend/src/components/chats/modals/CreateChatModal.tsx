import { useState } from "react";
import Modal from "../../common/Modal";
import styles from "./CreateChatModal.module.css";
import errorIcon from "/src/assets/error-icon.png";

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (
    chatName: string,
    members: string[],
    isPublic: boolean
  ) => Promise<void>;
}

function CreateChatModal({
  isOpen,
  onClose,
  onCreateChat,
}: CreateChatModalProps) {
  const [memberEntryBox, setMemberEntryBox] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<string[]>([]);

  const handleAddMember = async (newMember: string) => {
    // The user has entered nothing
    if (!newMember) {
      setError(`Please enter a username.`);
      return;
    }

    // The user has entered their own username
    if (sessionStorage.getItem("currentUser") === newMember) {
      setError(`You have entered your own username.`);
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
        setError(`User "${newMember}" does not exist.`);
        return;
      }

      const user_id = await response.json();

      // User is already a member
      if (members.includes(user_id)) {
        setError(
          `User "${newMember} is already in the group of users to be added.`
        );
        return;
      }

      // Add member, remove errors
      if (response.ok) {
        setError(null);
        setMembers((prevMembers) => [...prevMembers, user_id]);
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

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddMember(memberEntryBox);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const chatName = formData.get("chat-name") as string;
    const isPublic = formData.get("is-public") === "on";

    await onCreateChat(chatName, members, isPublic);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setError(null);
        setMembers([]);
        setMemberEntryBox("");
        onClose();
      }}
      title="Create New Chat"
    >
      <form className={styles.entryArea} onSubmit={handleSubmit}>
        <label className={styles.labelInputPair}>
          Chat Name:{" "}
          <input className={styles.inputBox} name="chat-name" required />
        </label>

        <div className={styles.addMemberBox}>
          <label className={styles.addMemberLabel}>
            Add Chat Members:{" "}
            <div className={styles.inputContainer}>
              <input
                name="add-member"
                onChange={(e) => setMemberEntryBox(e.currentTarget.value)}
                onKeyDown={handleKeyPress}
              />
              {error && (
                <div className={styles.errorTooltip}>
                  <img
                    src={errorIcon}
                    alt="Error icon"
                    width={25}
                    height={25}
                  />
                  <div className={styles.tooltip}>{error}</div>
                </div>
              )}
            </div>
            <button
              type="button"
              className={styles.addMemberButton}
              onClick={() => handleAddMember(memberEntryBox)}
            >
              Add
              <div className="sr-only">member</div>
            </button>
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
        <label>
          Set Public: <input name="is-public" type="checkbox"></input>
        </label>

        <button className={styles.createChatButton} type="submit">
          Create Chat
        </button>
      </form>
    </Modal>
  );
}

export default CreateChatModal;
