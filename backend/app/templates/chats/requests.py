""" Templates for chats.py requests """
from typing import List, Optional
import uuid
from pydantic import BaseModel, Field


class ChatHistoryRequest(BaseModel):
    """ Data structure for chat history request.

    Attributes:
        start_id (Optional[str]): Hex string identifier for the start message.
        end_id (Optional[str]): Hex string identifier for the end message.
        count (Optional[int]): Number of messages to retrieve.
    """
    start_id: Optional[str] = Field(None, alias="startMessageId")
    end_id: Optional[str] = Field(None, alias="endMessageId")
    count: Optional[int] = Field(..., alias="count")

    class Config:
        """ Sets ChatHistoryRequest to expect aliases from frontend """
        populate_by_name = True


class NewChatData(BaseModel):
    """ Data structure for data used to create a new chat.

    Attributes:
        chat_id (bytes): Generated uuid for chat.
        chat_name (str): Name of the chat
        other_users (List[str]): All other users to add to chat. May be empty.
        is_public (bool): If the chat is public.
    """
    chat_id: bytes = Field(default_factory=lambda: uuid.uuid4().bytes)
    chat_name: str = Field(..., alias="chatName")
    other_users: List[str] = Field(..., alias="otherUsers")
    is_public: bool = Field(..., alias="isPublic")

    class Config:
        """ Sets CreateChat Request Model to expect aliases from frontend """
        populate_by_name = True
