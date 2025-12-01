/** Represents the role of a user in a chat */
export type UserRole = "owner" | "admin" | "member";

/**
 * Represents the information for each user in a chat
 */
export interface UserInfo {
  /** Unique identifier for user */
  userId: string;
  /** Username of user */
  username: string;
  /** Role of user in chat */
  role: UserRole;
}

/**
 * Represents a message within a chat
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  messageId: string;
  /** Sender's user ID in hexadecimal format (null for system messages) */
  senderId: string;
  /** Sender's username for display purposes */
  senderUsername: string;
  /** Content of the message */
  content: string;
  /** ISO datetime string of when the message was sent */
  timestamp: string;
}

/**
 * Represents the data structure for displaying a chat in the list view
 *
 * @remarks
 * These fields match exactly with the backend ChatPreview type.
 */
export interface ChatPreview {
  /** Unique identifier for the chat in hexadecimal format */
  chatId: string;
  /** Display name of the chat */
  chatName: string;
  /** ISO datetime string of the creation time of the chat */
  createdAt: string;
  /** Optional identifier of the other user in direct messages (hexadecimal format) */
  dmParticipantId?: string;
  /** Last message sent in the chat */
  lastMessage?: ChatMessage;
  /** Role of user in non-dm chat */
  myRole?: UserRole;
}

/** Details for the chat when its displayed in LiveChat */
export interface ChatDetails {
  /** Unique identifier for the chat in hexadecimal format */
  chatId: string;
  /** All participants in the chat */
  participants: UserInfo[];
  /** Messages in the chat */
  messages: ChatMessage[];
}

/** Types describing format of websocket messages. */
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
}

export interface WSChatMessageData {
  chatId: string;
  message: ChatMessage;
}

// interface WSTypingIndicatorData {
//   chatId: string;
//   userId: string;
//   username: string;
//   isTyping: boolean;
// }

export interface WSUserAddedData {
  chatPreview: ChatPreview;
  addedBy: string;
}

export interface WSUserRemovedData {
  chatId: string;
  removedBy: string;
}

// Message type to data type mapping
export type MessageTypeMap = {
  message: WSChatMessageData;
  // typing_indicator: WSTypingIndicatorData;
  added_to_chat: WSUserAddedData;
  removed_from_chat: WSUserRemovedData;
};
