""" Templates for chats.py responses """
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ChatPreview(BaseModel):
    """ Data structure for chat preview information.

    Attributes:
        chat_id (str): Unique identifier for the chat as hex string.
        chat_name (str): Display name of the chat.
        last_activity (datetime): Timestamp of the last activity occuring in the chat.
        dm_participant_id (Optional[str]): Hex string identifier for other user if the chat is a dm.
        last_message (Optional[str]): Last message sent in chat, if exists.
    """
    chat_id: str = Field(..., alias="chatId")
    chat_name: str = Field(..., alias="chatName")
    last_activity: datetime = Field(..., alias="lastActivity")
    dm_participant_id: Optional[str] = Field(..., alias="dmParticipantId")
    last_message: Optional[str] = Field(..., alias="lastMessage")

    class Config:
        """ Sets ChatListItem to serialise to JSON as alias names. """
        populate_by_name = True


class ChatData(BaseModel):
    """_summary_

    Args:
        BaseModel (_type_): _description_
    """
