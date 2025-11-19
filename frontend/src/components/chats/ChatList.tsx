import type { ChatData } from "../../hooks/chats/useChats";
import styles from "./ChatList.module.css";
import ChatListItem from "./ChatListItem";

interface ChatListProps {
  chats: ChatData[];
  isLoading: boolean;
}

const ChatList: React.FC<ChatListProps> = ({ chats, isLoading }) => {
  return (
    <div className={styles.chatList}>
      {isLoading ? (
        <h2> Chats Loading...</h2>
      ) : chats.length === 0 ? (
        <h2> You aren't in any chats. </h2>
      ) : (
        chats.map((chat) => (
          <ChatListItem
            key={chat.chatId}
            name={chat.chatName}
            isDm={!!chat.dmParticipantId}
            message={chat.lastMessage.content}
            lastActivity={chat.lastMessage.timestamp}
            url={`/chats/${chat.chatId}`}
          ></ChatListItem>
        ))
      )}
    </div>
  );
};

export default ChatList;
