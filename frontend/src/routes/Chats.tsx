import { useEffect } from "react";
import threeDots from "../assets/three-dots.png";
import threeDotsLight from "../assets/three-dots-light.png";
import Dropdown, { type DropdownOption } from "../components/common/Dropdown";
import styles from "./Chats.module.css";
import { useModal } from "../hooks/common/useModal";
import CreateChatModal from "../components/chats/CreateChatModal";
import { useSession } from "../hooks/common/useSession";
import { useParams } from "react-router";
import LiveChat from "../components/chats/LiveChat";
import ChatList from "../components/chats/ChatList";
import { useChats } from "../hooks/chats/useChats";

function Chats() {
  const chats = useChats();
  const createChatModal = useModal();
  const session = useSession();

  const params = useParams();
  const chatId = params.chatId;

  useEffect(() => {
    chats.fetchChats();
  }, []);

  useEffect(() => {
    if (chats.chats.length > 0 && !chats.loading) {
      chats.connectToChats(chats.chats);
    }
  }, [chats.chats, chats.loading, chats.connectToChats]);

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
      {chats.error && (
        <div
          className="error-box"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {chats.error}
        </div>
      )}
      <div
        className={`${styles.chatSelectionList} ${chatId ? styles.mobileHidden : ""}`}
      >
        <div className={styles.topBar}>
          <h2> ChatApp </h2>
          <Dropdown
            darkLogo={threeDots}
            lightLogo={threeDotsLight}
            menuOptions={selectionListDropdown}
          ></Dropdown>
        </div>
        <div className={styles.middleBar}>
          <ChatList
            chats={chats.sortedChatPreviews}
            isLoading={chats.loading}
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
        <LiveChat chatId={chatId}></LiveChat>
      </div>
    </div>
  );
}

export default Chats;
