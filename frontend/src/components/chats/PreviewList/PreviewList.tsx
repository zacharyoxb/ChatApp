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
            key={chat.chat_id}
            chatUrl={`/chats/${chat.chat_id}`}
            chatName={chat.chat_name}
            createdAt={chat.created_at}
            isDm={!!chat.dm_participant_id}
            lastMessage={chat.last_message}
            isDummy={chat.is_dummy}
          ></PreviewListItem>
        ))
      )}
    </div>
  );
};

export default PreviewList;
