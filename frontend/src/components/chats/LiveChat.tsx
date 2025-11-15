import type { ChatData } from "../../hooks/chats/useChats";
import styles from "./LiveChat.module.css";

interface LiveChatProps {
  chatData: ChatData | undefined;
}

const LiveChat: React.FC<LiveChatProps> = ({ chatData }) => {
  if (chatData == undefined) {
    return <h2 className={styles.noChat}> No chat selected. </h2>;
  }

  return (
    <div className={styles.liveChat}>
      <div className={styles.titleBar}>
        <div className={styles.leftSide}>
          <div> image </div>
          <div> {chatData.chatName} </div>
        </div>
        <div className={styles.rightSide}>
          <div> search </div>
          <div> dropdown </div>
        </div>
      </div>
      <div className={styles.messagesContainer}>
        {chatData.messages.map((message, index) => (
          <div key={index} className={styles.message}>
            <span className={styles.sender}>{message.senderId}:</span>
            <span className={styles.content}>{message.content}</span>
          </div>
        ))}
        chat here
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
