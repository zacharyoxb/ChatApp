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

function Chats() {
  const useChats = useChatList();
  const createChatModal = useModal();
  const session = useSession();

  useEffect(() => {
    useChats.fetchChats();
  }, []);

  const dropdownOptions: DropdownOption[] = [
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
      <div className={styles.topBar}>
        <h1> ChatApp </h1>
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
        <Dropdown
          darkLogo={threeDots}
          lightLogo={threeDotsLight}
          menuOptions={dropdownOptions}
        ></Dropdown>
      </div>
      <ChatList chats={useChats.sortedChats} />
      <div className={styles.bottomBar}></div>
      <CreateChatModal
        isOpen={createChatModal.isOpen}
        onClose={createChatModal.close}
        onCreateChat={useChats.createChat}
      ></CreateChatModal>
    </div>
  );
}

export default Chats;
