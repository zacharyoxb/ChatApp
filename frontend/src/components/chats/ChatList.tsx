import type { ChatListItemData } from "../../hooks/chats/useChatList";
import styles from "./ChatList.module.css";
import ChatListItem from "./ChatListItem";

interface ChatListProps {
  chats: ChatListItemData[];
}

const ChatList: React.FC<ChatListProps> = ({ chats }) => {
  return (
    <div className={styles.chatsArea}>
      {chats.length === 0 ? (
        <h2> You aren't in any chats. </h2>
      ) : (
        chats.map((chat) => (
          <ChatListItem
            key={chat.chatId}
            name={chat.chatName}
            is_dm={!!chat.otherUserId}
            message="Lorem Ipsum"
            last_message_at={chat.lastMessageAt}
            url={`/chats/${chat.chatId}`}
          ></ChatListItem>
        ))
      )}
    </div>
  );
};

export default ChatList;
