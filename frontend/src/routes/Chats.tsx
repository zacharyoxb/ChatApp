import { useCallback, useEffect, useRef } from "react";

import Dropdown, { type DropdownOption } from "../components/common/Dropdown";
import styles from "./Chats.module.css";
import { useModal } from "../hooks/common/useModal";
import CreateChatModal from "../components/chats/modals/CreateChatModal";
import { useSession } from "../hooks/common/useSession";
import { useParams } from "react-router";
import LiveChat from "../components/chats/LiveChat/LiveChat";
import ChatList from "../components/chats/ChatList/ChatList";
import { useChats } from "../hooks/chats/useChats";
import { useChatPreviews } from "../hooks/chats/useChatPreviews";
import type { UserInfo } from "../types/chats";

function Chats() {
  const session = useSession();
  const chatPreviews = useChatPreviews();
  const chats = useChats();
  const createChatModal = useModal();

  const params = useParams();
  const chatId = params.chatId;

  const hasFetchedRef = useRef(false);
  const hasFetchedHistoryRef = useRef<Map<string, boolean>>(new Map());

  const ws = useRef<WebSocket>(null);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      chatPreviews.fetchChatPreviews();
    }
  }, []);

  useEffect(() => {
    // If previews have finished loading and there is at least 1 chat
    if (chatPreviews.data.length > 0 && !chatPreviews.isLoading) {
      // If a chat is selected and hasn't already been fetched
      if (chatId && !hasFetchedHistoryRef.current.get(chatId)) {
        hasFetchedHistoryRef.current.set(chatId, true);
        chats.fetchChatDetails(chatId);
      }
      chats.connectWebsocket();
    }
  }, [chatId, chatPreviews.data, chats.connectWebsocket]);

  /**
   * Creates a chat, injecting the current WebSocket for real-time updates.
   * Used by CreateChatModal to handle chat creation with WebSocket subscription.
   */
  const handleCreateChat = useCallback(
    async (chatName: string, members: UserInfo[], isPublic: boolean) => {
      if (chats.chatWebsocket === null) {
        return;
      }
      await chatPreviews.createChat(
        chatName,
        members,
        isPublic,
        chats.chatWebsocket
      );
    },
    [chatPreviews.createChat, ws]
  );

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
          {chatPreviews.error}
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
            chats={chatPreviews.sortedChatPreviews}
            isLoading={chatPreviews.isLoading}
          />
        </div>
        <div className={styles.bottomBar}></div>
        <CreateChatModal
          isOpen={createChatModal.isOpen}
          onClose={createChatModal.close}
          onAddMember={chats.fetchUserInfo}
          onCreateChat={handleCreateChat}
        ></CreateChatModal>
      </div>
      <div
        className={`${styles.chatArea} ${!chatId ? styles.mobileHidden : ""}`}
      >
        {chatId ? (
          <LiveChat
            chatPreview={chatPreviews.data.find(
              (preview) => preview.chatId == chatId
            )}
            chatDetails={chats.chatDetails.get(chatId)}
            chatWebSocket={chats.chatWebsocket}
          ></LiveChat>
        ) : (
          <h2 className={styles.noChat}> No chat selected. </h2>
        )}
      </div>
    </div>
  );
}

export default Chats;
