import styles from "./LiveChat.module.css";
import defaultDm from "/src/assets/default-dm.png";
import defaultGroup from "/src/assets/default-group.png";
import searchIcon from "/src/assets/search.png";
import searchIconLight from "/src/assets/search-light.png";
import threeDots from "/src/assets/three-dots.png";
import threeDotsLight from "/src/assets/three-dots-light.png";
import type { DropdownOption } from "../common/Dropdown";
import Dropdown from "../common/Dropdown";
import { useState } from "react";
import type { ChatDetails, ChatPreview } from "../../hooks/chats/useChats";

interface LiveChatProps {
  chatPreview: ChatPreview | undefined;
  chatDetails: ChatDetails | undefined;
  chatWebSocket: WebSocket | undefined;
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

const LiveChat: React.FC<LiveChatProps> = ({
  chatPreview,
  chatDetails,
  chatWebSocket,
}) => {
  const [messageInput, setMessageInput] = useState("");

  if (!chatPreview || !chatDetails) {
    return <h2 className={styles.noChat}> Temp </h2>;
  }

  const handleSendMessage = () => {
    if (messageInput.trim() === "") return;

    chatWebSocket?.send(
      JSON.stringify({
        type: "message",
        chatId: chatDetails.chatId,
        content: messageInput,
      })
    );

    setMessageInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const isDm = !!chatPreview.dmParticipantId;
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
                ? `${chatPreview.chatName}'s profile picture`
                : `${chatPreview.chatName} group icon`
            }
          />
          <div className={styles.chatTitle}> {chatPreview.chatName} </div>
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
        {chatDetails.messages.map((message, index) => (
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
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className={styles.sendButton} onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default LiveChat;
