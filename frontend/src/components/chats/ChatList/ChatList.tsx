import type { ChatPreview } from "../../../hooks/chats/useChats";
import styles from "./ChatList.module.css";
import ChatListItem from "./ChatListItem";

interface ChatListProps {
  chats: ChatPreview[];
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
            chatUrl={`/chats/${chat.chatId}`}
            chatName={chat.chatName}
            isDm={!!chat.dmParticipantId}
            lastMessage={chat.lastMessage}
          ></ChatListItem>
        ))
      )}
    </div>
  );
};

export default ChatList;
