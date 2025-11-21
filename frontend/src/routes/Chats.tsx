import { useEffect, useRef } from "react";

import Dropdown, { type DropdownOption } from "../components/common/Dropdown";
import styles from "./Chats.module.css";
import { useModal } from "../hooks/common/useModal";
import CreateChatModal from "../components/chats/modals/CreateChatModal";
import { useSession } from "../hooks/common/useSession";
import { useParams } from "react-router";
import LiveChat from "../components/chats/LiveChat/LiveChat";
import ChatList from "../components/chats/ChatList/ChatList";
import { useChats } from "../hooks/chats/useChats";

function Chats() {
  const chats = useChats();
  const createChatModal = useModal();
  const session = useSession();

  const params = useParams();
  const chatId = params.chatId;

  const hasFetchedRef = useRef(false);
  const hasFetchedHistoryRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      chats.fetchChatPreviews();
    }
  }, []);

  useEffect(() => {
    if (chats.chatPreviews.length > 0 && !chats.isLoadingPreviews) {
      if (chatId && !hasFetchedHistoryRef.current.get(chatId)) {
        hasFetchedHistoryRef.current.set(chatId, true);
        chats.fetchChatDetails(chatId);
      }
      chats.connectToChats(chats.chatPreviews);

      if (chats.isErrorPreviews) {
        console.error("Error connecting to chats:", chats.isErrorPreviews);
      }
    }
  }, [
    chatId,
    chats.chatPreviews,
    chats.isLoadingPreviews,
    chats.connectToChats,
  ]);

  const selectionListDropdown: DropdownOption[] = [
    {
      label: "Create Chat",
      action: createChatModal.open,
    },
    {
      label: "Logout",
      action: session.logout,
    },
  ];

  return (
    <div className={styles.parentDiv}>
      <h1 className="sr-only"> ChatApp </h1>
      {chats.isErrorPreviews && (
        <div
          className="error-box"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {chats.isErrorPreviews}
        </div>
      )}
      <div
        className={`${styles.chatSelectionList} ${chatId ? styles.mobileHidden : ""}`}
      >
        <div className={styles.topBar}>
          <h2> ChatApp </h2>
          <Dropdown menuOptions={selectionListDropdown}></Dropdown>
        </div>
        <div className={styles.middleBar}>
          <ChatList
            chats={chats.sortedChatPreviews}
            isLoading={chats.isLoadingPreviews}
          />
        </div>
        <div className={styles.bottomBar}></div>
        <CreateChatModal
          isOpen={createChatModal.isOpen}
          onClose={createChatModal.close}
          onCreateChat={chats.createChat}
        ></CreateChatModal>
      </div>
      <div
        className={`${styles.chatArea} ${!chatId ? styles.mobileHidden : ""}`}
      >
        {chatId ? (
          <LiveChat
            chatPreview={chats.chatPreviews.find(
              (preview) => preview.chatId == chatId
            )}
            chatDetails={chats.chatDetails.get(chatId)}
            chatWebSocket={chats.getSocketFromId(chatId)}
          ></LiveChat>
        ) : (
          <h2 className={styles.noChat}> No chat selected. </h2>
        )}
      </div>
    </div>
  );
}

export default Chats;
