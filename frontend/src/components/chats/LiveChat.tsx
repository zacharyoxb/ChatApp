import styles from "./LiveChat.module.css";

interface LiveChatProps {
  chatId: string | null;
}

const LiveChat: React.FC<LiveChatProps> = ({ chatId }) => {
  return <div className={styles.liveChat}></div>;
};

export default LiveChat;
