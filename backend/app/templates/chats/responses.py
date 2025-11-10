""" Templates for chats.py responses """
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ChatListItem(BaseModel):
    """ Data structure for chat preview information.

    Attributes:
        chat_id (str): Unique identifier for the chat as hex string.
        chat_name (str): Display name of the chat.
        last_message_at (datetime): Timestamp of the most recent message.
        other_user_id (Optional[str]): Hex string identifier for other user if the chat is a dm.
        last_message (Optional[str]): Last message sent in chat, if exists.
    """
    chat_id: str = Field(..., alias="chatId")
    chat_name: str = Field(..., alias="chatName")
    last_message_at: datetime = Field(..., alias="lastMessageAt")
    other_user_id: Optional[str] = Field(..., alias="otherUserId")
    last_message: Optional[str] = Field(..., alias="lastMessage")

    class Config:
        """ Sets ChatListItem to serialise to JSON as alias names. """
        populate_by_name = True
