import { useEffect } from "react";
import { useParams } from "react-router";

import Dropdown, { type DropdownOption } from "../components/common/Dropdown";
import styles from "./Chats.module.css";
import { useModal } from "../hooks/common/useModal";
import CreateChatModal from "../components/chats/modals/CreateChatModal";
import { useSession } from "../hooks/common/useSession";
import LiveChat from "../components/chats/LiveChat/LiveChat";
import PreviewList from "../components/chats/ChatList/PreviewList";
import { useChatWebSocket } from "../hooks/chats/useChatWebSocket";
import { useChatPreviews } from "../hooks/chats/useChatPreviews";
import type { UserInfo } from "../types/chats";
import { useChatDetails } from "../hooks/chats/useChatDetails";
import { useUserInfo } from "../hooks/chats/useUserInfo";

function Chats() {
  const session = useSession();
  const params = useParams();
  const chatId = params.chatId;

  // Chat hooks
  const userInfo = useUserInfo();
  const chatPreviews = useChatPreviews();
  const chatDetails = useChatDetails(chatId);
  const chatWebSocket = useChatWebSocket();

  const createChatModal = useModal();

  useEffect(() => {
    if (!chatWebSocket.isConnecting) {
      chatWebSocket.connect(
        "temp",
        chatPreviews.updateLastMessage,
        chatDetails.addMessage,
        chatPreviews.handleUserAddedToChat
      );
    }
  }, [chatPreviews.data, chatWebSocket.connect]);

  /**
   * Creates a chat, injecting the current WebSocket for real-time updates.
   * Used by CreateChatModal to handle chat creation with WebSocket subscription.
   */
  const handleCreateChat = async (
    chatName: string,
    members: UserInfo[],
    isPublic: boolean
  ) => {
    await chatPreviews.createChatMutation.mutateAsync({
      chatName,
      otherUsers: members,
      isPublic,
    });
  };

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
      {chatPreviews.error && (
        <div
          className="error-box"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {chatPreviews.error.message}
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
          {chatPreviews.isPending ? (
            <h2 className={styles.loadingOrError}> Chats Loading...</h2>
          ) : chatPreviews.isError ? (
            <h2 className={styles.loadingOrError}>
              {" "}
              Chat Error: {chatPreviews.error?.message || "Unknown error"}
            </h2>
          ) : (
            <PreviewList chats={chatPreviews.sortedChatPreviews} />
          )}
        </div>
        <div className={styles.bottomBar}></div>
        <CreateChatModal
          isOpen={createChatModal.isOpen}
          onClose={createChatModal.close}
          onAddMember={userInfo.fetchUserInfo}
          onCreateChat={handleCreateChat}
        ></CreateChatModal>
      </div>
      <div
        className={`${styles.chatArea} ${!chatId ? styles.mobileHidden : ""}`}
      >
        {!chatId && <h2 className={styles.noChat}> No Chat Selected. </h2>}
        {chatId &&
          (chatDetails.isPending ? (
            <h2 className={styles.loadingOrError}> Chat History Loading... </h2>
          ) : chatDetails.isError ? (
            <h2 className={styles.loadingOrError}>
              {" "}
              Chat History Error:{" "}
              {chatDetails.error?.message || "Unknown Error"}
            </h2>
          ) : (
            <LiveChat
              chatPreview={
                chatPreviews.data.find((preview) => preview.chatId == chatId) ||
                null
              }
              chatDetails={chatDetails.data || null}
              chatWebSocket={chatWebSocket.ws}
            ></LiveChat>
          ))}
      </div>
    </div>
  );
}

export default Chats;
