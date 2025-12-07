import { Suspense, useState } from "react";
import Modal from "../../common/Modal";
import styles from "./CreateChatModal.module.css";
import errorIcon from "/src/assets/error-icon.png";
import add from "/src/assets/add.png";
import addLight from "/src/assets/add-light.png";
import minus from "/src/assets/minus.png";
import minusLight from "/src/assets/minus-light.png";
import type { ChatUserInfo } from "../../../types/chats";
import { useUserInfo } from "../../../queries/userQueries";
import { useAuthSession } from "../../../queries/authQueries";
import { useChatAddMutation } from "../../../queries/chatPreviewQueries";

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateChatModal({ isOpen, onClose }: CreateChatModalProps) {
  const [memberEntryBox, setMemberEntryBox] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useAuthSession();
  const addChat = useChatAddMutation();
  const userInfoFetch = useUserInfo();

  const safeUsername = session?.data?.username || "Placeholder";

  const [usernameToIdMap, setUsernameToIdMap] = useState<
    Record<string, ChatUserInfo>
  >({});
  const [members, setMembers] = useState<ChatUserInfo[]>([]);

  const handleAddMember = async (newMember: string) => {
    // The user has entered nothing
    if (!newMember) {
      setError(`Please enter a username.`);
      return;
    }

    // The user has entered their own username
    if (safeUsername === newMember) {
      setError(`You have entered your own username.`);
      return;
    }

    // User is already a member
    if (usernameToIdMap[newMember]) {
      setError(
        `User "${newMember} is already in the group of users to be added.`,
      );
      return;
    }

    try {
      const fetchedInfo =
        userInfoFetch.getCachedUser(newMember) ||
        (await userInfoFetch.getUser(newMember));

      if (fetchedInfo == null) {
        setError(`User "${newMember}" does not exist.`);
        return;
      }
      setUsernameToIdMap((prev) => ({ ...prev, [newMember]: fetchedInfo }));
      setMembers((prevMembers) => [...prevMembers, fetchedInfo]);
      setMemberEntryBox("");
      setError(null);
    } catch (error) {
      error instanceof Error
        ? setError(`Error fetching user: ${error.message}`)
        : new Error("Unknown error");
      return;
    }
  };

  const handleRemoveMember = (userToRemove: ChatUserInfo) => {
    setMembers(members.filter((member) => member !== userToRemove));
    setUsernameToIdMap((prev) => {
      const { [userToRemove.username]: _, ...rest } = prev;
      return rest;
    });
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

    addChat.mutate({ chatName, otherUsers: members, isPublic });
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
          <Suspense fallback={<span> You </span>}>
            <div className={styles.userRectangle}>
              <span>You ({session?.data?.username})</span>
            </div>
          </Suspense>

          <div className={styles.membersMap}>
            {members.map((member) => (
              <div key={member.userId} className={styles.userRectangle}>
                <span> {member.username}</span>
                <button
                  type="button"
                  className={styles.smallIcon}
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
            <label htmlFor="username-input">Add Chat Member:</label>
            <input
              id="username-input"
              value={memberEntryBox}
              onChange={(e) => setMemberEntryBox(e.currentTarget.value)}
              onKeyDown={handleKeyPress}
              aria-label="Username of user to add to chat"
              placeholder="Enter username"
            ></input>

            <button
              className={styles.addMemberButton}
              type="button"
              onClick={() => handleAddMember(memberEntryBox)}
              aria-label="Click to add user to chat"
            >
              <img
                className="darkIcon"
                src={add}
                width={20}
                height="auto"
                alt="Add user to new chat"
              ></img>
              <img
                className="lightIcon"
                src={addLight}
                width={20}
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
