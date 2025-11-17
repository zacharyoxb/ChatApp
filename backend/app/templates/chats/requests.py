""" Templates for chats.py requests """
from typing import List
import uuid
from pydantic import BaseModel, Field


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
