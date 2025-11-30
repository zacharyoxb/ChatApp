import type { ChatPreview } from "../../../types/chats";
import styles from "./PreviewList.module.css";
import ChatListItem from "./ChatListItem";

interface PreviewListProps {
  chats: ChatPreview[];
}

const PreviewList: React.FC<PreviewListProps> = ({ chats }) => {
  return (
    <div className={styles.chatList}>
      {chats.length === 0 ? (
        <h2> You aren't in any chats. </h2>
      ) : (
        chats.map((chat) => (
          <ChatListItem
            key={chat.chatId}
            chatUrl={`/chats/${chat.chatId}`}
            chatName={chat.chatName}
            createdAt={chat.createdAt}
            isDm={!!chat.dmParticipantId}
            lastMessage={chat.lastMessage}
          ></ChatListItem>
        ))
      )}
    </div>
  );
};

export default PreviewList;
