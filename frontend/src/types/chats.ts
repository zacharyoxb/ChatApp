/** Represents the role of a user in a chat */
export type UserRole = "owner" | "admin" | "member";

/**
 * Represents the information for each user in a chat
 */
export interface ChatUserInfo {
  /** Unique identifier for user */
  user_id: string;
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
  message_id: string;
  /** Sender's user ID in hexadecimal format (null for system messages) */
  sender_id: string;
  /** Sender's username for display purposes */
  sender_username: string;
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
  chat_id: string;
  /** Display name of the chat */
  chat_name: string;
  /** ISO datetime string of the creation time of the chat */
  created_at: string;
  /** Optional identifier of the other user in direct messages (hexadecimal format) */
  dm_participant_id?: string;
  /** Last message sent in the chat */
  last_message?: ChatMessage;
  /** Role of user in non-dm chat */
  my_role?: UserRole;
  /** Only present and true if the data is a dummy (optimistic query update) */
  is_dummy?: boolean;
}

/** Details for the chat when its displayed in LiveChat */
export interface ChatDetails {
  /** Unique identifier for the chat in hexadecimal format */
  chat_id: string;
  /** All participants in the chat */
  participants: ChatUserInfo[];
  /** Messages in the chat */
  messages: ChatMessage[];
}

/** Types describing format of websocket messages. */
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
}

export interface WSChatMessageData {
  chat_id: string;
  message: ChatMessage;
}

// interface WSTypingIndicatorData {
//   chat_id: string;
//   user_id: string;
//   username: string;
//   is_typing: boolean;
// }

export interface WSUserAddedData {
  chat_preview: ChatPreview;
  added_by: string;
}

export interface WSUserRemovedData {
  chat_id: string;
  removed_by: string;
}

// Message type to data type mapping
export type MessageTypeMap = {
  message: WSChatMessageData;
  // typing_indicator: WSTypingIndicatorData;
  added_to_chat: WSUserAddedData;
  removed_from_chat: WSUserRemovedData;
};
