""" Templates for chats.py responses """
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """ Enum representing possible user roles within a chat.

    Attributes:
        OWNER: Highest privilege level, can perform all administrative actions
        ADMIN: Can manage users and moderate content, but cannot delete chat
        MEMBER: Basic participant with standard messaging permissions
    """
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class UserInfo(BaseModel):
    """ Basic user information for chat participants.

    Attributes:
        user_id: Unique identifier for the user as a string
        username: Display name of the user
        role: User's permission level within the chat context
    """
    user_id: str = Field(..., alias="userId")
    username: str
    role: UserRole


class ChatMessage(BaseModel):
    """ Represents an individual message within a chat.

    Attributes:
        message_id: Unique identifier for the message
        sender_id: Identifier of the message sender. Use "SERVER" for system messages
        sender_username: Display name of the sender. None for system messages
        content: The text content of the message
        timestamp: ISO format string representing when the message was sent
    """
    message_id: str = Field(..., alias="messageId")
    sender_id: str = Field(..., alias="senderId")
    # USE PARTICIPANTS TO FILL THIS OPTIONAL, DOING A
    # DB CHECK FOR ANY SENDER_IDs OF USERS THAT HAVE
    # SINCE LEFT THE CHAT, SO THIS SHOWS CURRENT USERNAME
    # SO I CAN IMPLEMENT USERNAME CHANGES
    sender_username: Optional[str] = Field(None, alias="senderUsername")
    content: str
    timestamp: str

    class Config:
        """ Pydantic configuration for field name aliasing."""
        populate_by_name = True


class ChatPreview(BaseModel):
    """ Summary information for displaying a chat in a list view.

    Attributes:
        chat_id: Unique identifier for the chat
        chat_name: Display name of the chat
        dm_user_id: The id of the other user if the chat is a dm.
        last_message: The most recent message in the chat, if any exists
        my_role: Current user's role within this chat. None if chat is a dm.
    """
    chat_id: str = Field(..., alias="chatId")
    chat_name: str = Field(..., alias="chatName")
    dm_participant_id: Optional[str] = Field(..., alias="dmParticipantId")
    last_message: Optional[ChatMessage] = Field(..., alias="lastMessage")
    my_role: Optional[UserRole] = Field(..., alias="myRole")

    class Config:
        """ Pydantic configuration for field name aliasing."""
        populate_by_name = True


class ChatDetails(BaseModel):
    """ Complete chat information including all participants and message history.

    Attributes:
        chat_id: Unique identifier for the chat
        participants: List of all users in the chat with their roles and info
        messages: Chronological list of messages in the chat (oldest first)
    """
    chat_id: str = Field(..., alias="chatId")
    participants: List[UserInfo]
    messages: List[ChatMessage]

    class Config:
        """ Pydantic configuration for field name aliasing."""
        populate_by_name = True
