""" Templates for chats.py responses """
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ChatPreview(BaseModel):
    """ Data structure for chat preview information.

    Attributes:
        chat_id (str): Unique identifier for the chat as hex string.
        chat_name (str): Display name of the chat.
        dm_participant_id (Optional[str]): Hex string identifier for other user if the chat is a dm.
        last_message (Optional[str]): Last message sent in chat.
        last_activity (Optional[datetime]): Timestamp of the last activity occuring in the chat.
    """
    chat_id: str = Field(..., alias="chatId")
    chat_name: str = Field(..., alias="chatName")
    dm_participant_id: Optional[str] = Field(..., alias="dmParticipantId")
    last_message: Optional[str] = Field(..., alias="lastMessage")
    last_activity: Optional[datetime] = Field(..., alias="lastActivity")

    class Config:
        """ Sets ChatListItem to serialise to JSON as alias names. """
        populate_by_name = True


class ChatMessage(BaseModel):
    """ Data structure for chat messages.

    Attributes:
        message_id (str): String id for message 
        sender_id (Optional[str]): Hex string id for user if user is sending the message,
          None if the message is a system message.
        content (str): Message contents.
        timestamp (str): Isoformat string representing when the message was sent.
    """
    message_id: str = Field(..., alias="messageId")
    sender_id: Optional[str] = Field(..., alias="senderId")
    content: str
    timestamp: str

    class Config:
        """ Sets ChatMessage model to send aliases to frontend """
        populate_by_name = True
