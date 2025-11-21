import { useState } from "react";
import Modal from "../../common/Modal";
import styles from "./CreateChatModal.module.css";
import errorIcon from "/src/assets/error-icon.png";
import add from "/src/assets/add.png";
import addLight from "/src/assets/add-light.png";
import minus from "/src/assets/minus.png";
import minusLight from "/src/assets/minus-light.png";

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

  const [usernameToIdMap, setUsernameToIdMap] = useState<
    Record<string, string>
  >({});
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

    // User is already a member
    if (usernameToIdMap[newMember]) {
      setError(
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
        setError(`User "${newMember}" does not exist.`);
        return;
      }

      const response_obj = await response.json();
      const user_id = response_obj.userId;
      setUsernameToIdMap((prev) => ({ ...prev, [newMember]: user_id }));

      setError(null);
      setMembers((prevMembers) => [...prevMembers, user_id]);
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
          <div className={styles.chatNameLabel}>Chat Name: </div>
          <input className={styles.inputBox} name="chat-name" required />
        </label>

        <div className={styles.userListContainer}>
          <div className={styles.userRectangle}>
            <span>You ({sessionStorage.getItem("currentUser")})</span>
          </div>
          <div className={styles.membersMap}>
            {members.map((member) => (
              <div key={member} className={styles.userRectangle}>
                <span> {member}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member)}
                >
                  <img
                    className="darkIcon"
                    src={minus}
                    width={20}
                    height="auto"
                    alt={`Remove user '${member}' from chat`}
                  ></img>
                  <img
                    className="lightIcon"
                    src={minusLight}
                    width={20}
                    height="auto"
                    alt={`Remove user '${member}' from chat`}
                  ></img>
                </button>
              </div>
            ))}
          </div>
          <div className={styles.addUserArea}>
            {error && (
              <div className={styles.errorTooltip}>
                <img src={errorIcon} alt="Error icon" width={25} height={25} />
                <div className={styles.tooltip}>{error}</div>
              </div>
            )}
            <label>
              Add Chat Member:
              <input
                name="add-member"
                onChange={(e) => setMemberEntryBox(e.currentTarget.value)}
                onKeyDown={handleKeyPress}
                aria-label="Username to add to chat"
                placeholder="Enter username"
              ></input>
            </label>

            <button
              className={styles.addMemberButton}
              name="add-member-button"
              type="button"
              onKeyDown={() => handleAddMember}
              aria-label="Click to add user to chat"
            >
              <img
                className="darkIcon"
                src={add}
                width={25}
                height="auto"
                alt="Add user to new chat"
              ></img>
              <img
                className="lightIcon"
                src={addLight}
                width={25}
                height="auto"
                alt="Add user to new chat"
              ></img>
            </button>
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
