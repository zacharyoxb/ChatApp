import type { ChatData } from "../../hooks/chats/useChats";
import styles from "./LiveChat.module.css";

interface LiveChatProps {
  chatData: ChatData | undefined;
}

const LiveChat: React.FC<LiveChatProps> = ({ chatData }) => {
  if (chatData == undefined) {
    return <h2 className={styles.noChat}> No chat selected. </h2>;
  }

  return <div className={styles.liveChat}></div>;
};

export default LiveChat;
