import { Suspense, useEffect } from "react";
import { useParams } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
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
import Dropdown from "../components/common/Dropdown";

function Chats() {
  const session = useSession();
  const params = useParams();
  const chatId = params.chatId;

  // Chat hooks
  const chatPreviews = useChatPreviews();
  const chatDetails = useChatDetails(chatId);
  const chatWebSocket = useChatWebSocket();
  const createChatModal = useModal();

  useEffect(() => {
    if (!chatWebSocket.isConnecting && chatPreviews.data) {
      chatWebSocket.connect(
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

  return (
    <div className={styles.parentDiv}>
      <h1 className="sr-only"> ChatApp </h1>

      {/** Left Side Chat Previews Bar */}
      <div
        className={`${styles.chatSelectionList} ${chatId ? styles.mobileHidden : ""}`}
      >
        <div className={styles.topBar}>
          <h2> ChatApp </h2>
          <Dropdown menuOptions={[
            {label: "Create Chat", action: createChatModal.open},
            {label: "Logout", action: session.logout}
          ]}></Dropdown>
        </div>
        <div className={styles.middleBar}>
          <ErrorBoundary 
          fallback={<h2 className={styles.loadingOrError}>
            Error Loading Chats: {chatPreviews.error?.message || "Unknown Error"} </h2>}
            resetKeys={["chatPreviews"]}>
            <Suspense fallback={<h2 className={styles.loadingOrError}> Chats Loading...</h2>}>
              <PreviewList chats={chatPreviews.data}></PreviewList>
            </Suspense>
          </ErrorBoundary>
        </div>
        <div className={styles.bottomBar}></div>
      </div>

      {/** Right Side Live Chat Area */}
      <div
        className={`${styles.chatArea} ${!chatId ? styles.mobileHidden : ""}`}
      >
        {!chatId ? <h2 className={styles.noChat}> No Chat Selected. </h2> :
         <ErrorBoundary fallback={<h2 className={styles.loadingOrError}>
              Error Loading Live Chat: {chatDetails.error?.message || "Unknown Error"}</h2>}
              resetKeys={["chatDetails"]}>
            <Suspense fallback={<h2 className={styles.loadingOrError}> Chat History Loading... </h2>}>
              <LiveChat
                chatPreview={
                  chatPreviews.data?.find((preview) => preview.chatId == chatId)
                }
                chatDetails={chatDetails.data}
                chatWebSocket={chatWebSocket.ws}
              />
            </Suspense>
        </ErrorBoundary>}
      </div>

      {/** Independent Chat Creation modal */}
      <CreateChatModal
          isOpen={createChatModal.isOpen}
          onClose={createChatModal.close}
          onCreateChat={handleCreateChat}
      />
    </div>
  );
}

export default Chats;
