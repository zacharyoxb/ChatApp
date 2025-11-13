import { useEffect } from "react";
import threeDots from "../assets/three-dots.png";
import threeDotsLight from "../assets/three-dots-light.png";
import Dropdown, { type DropdownOption } from "../components/common/Dropdown";
import styles from "./Chats.module.css";
import { useModal } from "../hooks/common/useModal";
import CreateChatModal from "../components/chats/CreateChatModal";
import { useChatList } from "../hooks/chats/useChatList";
import ChatList from "../components/chats/ChatList";
import { useSession } from "../hooks/common/useSession";
import { useParams } from "react-router";

function Chats() {
  const useChats = useChatList();
  const createChatModal = useModal();
  const session = useSession();

  const params = useParams();
  const chatId = params.chatId;

  useEffect(() => {
    useChats.fetchChats();
  }, []);

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
      {useChats.error && (
        <div
          className="error-box"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {useChats.error}
        </div>
      )}
      <div
        className={`${styles.chatSelectionList} ${chatId ? styles.mobileHidden : ""}`}
      >
        <div className={styles.topBar}>
          <h1> ChatApp </h1>
          <Dropdown
            darkLogo={threeDots}
            lightLogo={threeDotsLight}
            menuOptions={selectionListDropdown}
          ></Dropdown>
        </div>
        <div className={styles.middleBar}>
          <ChatList chats={useChats.sortedChats} isLoading={useChats.loading} />
          <div className={styles.openChatSpace}></div>
        </div>
        <div className={styles.bottomBar}></div>
        <CreateChatModal
          isOpen={createChatModal.isOpen}
          onClose={createChatModal.close}
          onCreateChat={useChats.createChat}
        ></CreateChatModal>
      </div>
      <div
        className={`${styles.chatArea} ${!chatId ? styles.mobileHidden : ""}`}
      >
        {!chatId && <div>No chat selected</div>}
      </div>
    </div>
  );
}

export default Chats;
