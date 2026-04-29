""" Templates for chats.py responses """
from enum import Enum
from typing import Any, List, Optional
from pydantic import BaseModel

class SelfUser(BaseModel):
    """ Returns the users' own ID. """
    user_id: str


class UserRole(str, Enum):
    """ Enum representing possible user roles within a chat.

    Attributes:
        OWNER (str): Highest privilege level, can perform all administrative actions
        ADMIN (str): Can manage users and moderate content, but cannot delete chat
        MEMBER (str): Basic participant with standard messaging permissions
    """
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class UserInfo(BaseModel):
    """ Basic user information for chat participants.

    Attributes:
        user_id (str): Unique identifier for the user as a string
        username (str): Display name of the user
        role (UserRole): User's permission level within the chat context
    """
    user_id: str
    username: str
    role: UserRole


class ChatMessage(BaseModel):
    """ Represents an individual message within a chat.

    Attributes:
        message_id (str): Unique identifier for the message
        sender_id (str): Identifier of the message sender. Use "SERVER" for system messages
        sender_username (Optional[str]): Display name of the sender. None for system messages
        content (str): The text content of the message
        timestamp (str): ISO format string representing when the message was sent
    """
    message_id: str
    sender_id: str
    sender_username: Optional[str]
    content: str
    timestamp: str


class ChatPreview(BaseModel):
    """ Summary information for displaying a chat in a list view.

    Attributes:
        chat_id (str): Unique identifier for the chat
        chat_name (str): Display name of the chat
        created_at: (str) ISO format string representing chat creation time
        dm_participant_id (Optional[str]): The id of the other user if the chat is a dm
        last_message (Optional[ChatMessage]): The most recent message in the chat, if any exists
        my_role (Optional[UserRole]): Current user's role within this chat. None if chat is a dm
    """
    chat_id: str
    chat_name: str
    created_at: str
    dm_participant_id: Optional[str]
    last_message: Optional[ChatMessage]
    my_role: Optional[UserRole]


class ChatDetails(BaseModel):
    """ Complete chat information including all participants and message history.

    Attributes:
        chat_id (str): Unique identifier for the chat
        participants (List[UserInfo]): List of all users in the chat with their roles and info
        messages (List[ChatMessage]): Chronological list of messages in the chat (oldest first)
    """
    chat_id: str
    participants: List[UserInfo]
    messages: List[ChatMessage]



class WebsocketMessage(BaseModel):
    """Generic WebSocket message container with type-based payload.

    Attributes:
        type (str): Type identifier for the message (e.g., 'message', 'user_added', 'user_removed')
        data (Dict[str, Any]): Payload data specific to the message type
    """
    type: str
    data: Any


class WSChatMessageData(BaseModel):
    """Data payload for chat message WebSocket events.

    Attributes:
        chat_id (str): Unique identifier of the chat where the message was sent
        message (ChatMessage): The chat message content and metadata
    """
    chat_id: str
    message: ChatMessage



class WSUserAddedData(BaseModel):
    """Data payload for user added to chat notification.

    Attributes:
        chat_preview (str): Chat data for the preview of the new chat. None
            if the notification is being sent to the chat creator/adder
        added_by (str): User ID of the person who added the user to the chat
    """
    chat_preview: ChatPreview
    added_by: str


class WSUserRemovedData(BaseModel):
    """Data payload for user removed from chat notification.

    Attributes:
        chat_id (str): Unique identifier of the chat the user was removed from
        removed_by (str): User ID of the person who removed the user from the chat
    """
    chat_id: str
    removed_by: str
