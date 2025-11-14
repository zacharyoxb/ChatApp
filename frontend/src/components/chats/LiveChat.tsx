import styles from "./LiveChat.module.css";

interface LiveChatProps {
  chatId: string | undefined;
}

const LiveChat: React.FC<LiveChatProps> = ({ chatId }) => {
  if (chatId == undefined) {
    return <h2 className={styles.noChat}> No chat selected. </h2>;
  }

  return <div className={styles.liveChat}></div>;
};

export default LiveChat;
