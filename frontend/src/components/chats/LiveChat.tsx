import type { ChatData } from "../../hooks/chats/useChats";
import styles from "./LiveChat.module.css";
import defaultDm from "/src/assets/default-dm.png";
import defaultGroup from "/src/assets/default-group.png";
import searchIcon from "/src/assets/search.png";
import searchIconLight from "/src/assets/search-light.png";
import threeDots from "/src/assets/three-dots.png";
import threeDotsLight from "/src/assets/three-dots-light.png";
import type { DropdownOption } from "../common/Dropdown";
import Dropdown from "../common/Dropdown";

interface LiveChatProps {
  chatData: ChatData | undefined;
}

const dropdownGroupChat: DropdownOption[] = [
  {
    label: "Chat Info",
    action: () => {},
  },
];

const dropdownDmChat: DropdownOption[] = [
  {
    label: "User Info",
    action: () => {},
  },
];

const LiveChat: React.FC<LiveChatProps> = ({ chatData }) => {
  if (chatData == undefined) {
    return <h2 className={styles.noChat}> No chat selected. </h2>;
  }
  const isDm = !!chatData.dmParticipantId;
  // Placeholder for chat image logic
  let chatImage = undefined;
  let image = chatImage || (isDm ? defaultDm : defaultGroup);

  return (
    <div className={styles.liveChat}>
      <div className={styles.titleBar}>
        <div className={styles.leftSide}>
          <img
            className={styles.profileImage}
            src={image}
            width={75}
            height={75}
            alt={
              isDm
                ? `${chatData.chatName}'s profile picture`
                : `${chatData.chatName} group icon`
            }
          />
          <div className={styles.chatTitle}> {chatData.chatName} </div>
        </div>
        <div className={styles.rightSide}>
          <button className={styles.searchButton}>
            <img
              src={searchIconLight}
              className={styles.searchLightIcon}
              width={40}
              height={40}
              alt={"Search chat messages"}
            ></img>
            <img
              src={searchIcon}
              className={styles.searchDarkIcon}
              width={40}
              height={40}
              alt={"Search chat messages"}
            ></img>
          </button>
          <Dropdown
            darkLogo={threeDots}
            lightLogo={threeDotsLight}
            menuOptions={isDm ? dropdownDmChat : dropdownGroupChat}
          ></Dropdown>
        </div>
      </div>
      <div className={styles.messagesContainer}>
        {chatData.messages.map((message, index) => (
          <div key={index} className={styles.message}>
            <span className={styles.sender}>{message.senderId}:</span>
            <span className={styles.content}>{message.content}</span>
          </div>
        ))}
      </div>
      <div className={styles.inputContainer}>
        <input
          type="text"
          className={styles.messageInput}
          placeholder="Type your message..."
        />
        <button className={styles.sendButton}>Send</button>
      </div>
    </div>
  );
};

export default LiveChat;
