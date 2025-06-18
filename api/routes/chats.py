"""
Imports List type.
Imports BaseModel class for use when routing
Imports APIRouter for routing.
"""


from typing import List
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter()

class Chat(BaseModel):
    """
    Holds group chat data
    """
    chat_id: int
    chat_name: str

# temporary db for testing
chat_db: List[Chat] = [
    Chat(
        chat_id=1,
        chat_name="Chat 1"
    ),
    Chat(
        chat_id=1,
        chat_name="Chat 2"
    ),
]

@router.get("/chats")
def fetch_chats():
    """
    Gets all chats
    """
    return chat_db

@router.post("/chats")
def create_chat(chat: Chat):
    """
    Creates new group chat
    """
    chat_db.append(chat)
    return {"id": chat.chat_id}

@router.get("/chats/{Chat}")
def display_chat(chat_id: int, chat_name: str):
    """
    Displays group chat
    """
    return {"user_id": chat_id, "username": chat_name}
