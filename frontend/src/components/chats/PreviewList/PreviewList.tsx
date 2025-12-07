import { useChatPreviews } from "../../../queries/chatPreviewQueries";
import styles from "./PreviewList.module.css";
import PreviewListItem from "./PreviewListItem";

const PreviewList = () => {
  const chats = useChatPreviews();
  return (
    <div className={styles.chatList}>
      {chats.data?.length === 0 ? (
        <h2> You aren't in any chats. </h2>
      ) : (
        chats.data?.map((chat) => (
          <PreviewListItem
            key={chat.chatId}
            chatUrl={`/chats/${chat.chatId}`}
            chatName={chat.chatName}
            createdAt={chat.createdAt}
            isDm={!!chat.dmParticipantId}
            lastMessage={chat.lastMessage}
            isDummy={chat.isDummy}
          ></PreviewListItem>
        ))
      )}
    </div>
  );
};

export default PreviewList;
