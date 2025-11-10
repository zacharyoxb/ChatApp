""" Templates for chats.py requests and responses """
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class NewChatData(BaseModel):
    """ Data structure for data used to create a new chat.

    Attributes:
        chat_name (str): Name of the chat
        other_users (List[str]): All other users to add to chat. May be empty.
        is_public (bool): If the chat is public.
    """
    chat_name: str = Field(..., alias="chatName")
    other_users: List[str] = Field(..., alias="otherUsers")
    is_public: bool = Field(..., alias="isPublic")

    class Config:
        """ Sets CreateChat Request Model to expect aliases from frontend """
        populate_by_name = True


class ChatListItem(BaseModel):
    """ Data structure for chat preview information.

    Attributes:
        chat_id (str): Unique identifier for the chat as hex string.
        chat_name (str): Display name of the chat.
        last_message_at (datetime): Timestamp of the most recent message.
        other_user_id (Optional[str]): Hex string identifier for other user if the chat is a dm.
    """
    chat_id: str = Field(..., alias="chatId")
    chat_name: str = Field(..., alias="chatName")
    last_message_at: datetime = Field(..., alias="lastMessageAt")
    other_user_id: Optional[str] = Field(..., alias="otherUserId")

    class Config:
        """ Sets ChatListItem to serialise to JSON as alias names. """
        populate_by_name = True
