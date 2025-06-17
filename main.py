"""
List type for db
BaseModel type for site parameters

fastAPI for API
"""

from typing import List
from pydantic import BaseModel

from fastapi import FastAPI

app = FastAPI()

class User(BaseModel):
    """
    Holds user data
    """
    user_id: int
    username: str


class Chat(BaseModel):
    """
    Holds group chat data
    """
    chat_id: int
    chat_name: str


user_db: List[User] = [
    User(
        user_id=1,
        username="Steve"
    ),
    User(
        user_id=2,
        username="Dave"
    ),
]

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


@app.get("/users")
def fetch_users():
    """
    Gets all users
    """
    return user_db

@app.post("/users")
def add_user(user: User):
    """
    Adds a user
    """
    user_db.append(user)
    return {"id": user.id}

@app.get("/users/{User}")
def display_profile(user_id: int, username: str):
    """
    Displays user profile
    """
    return {"user_id": user_id, "username": username}


@app.get("/chats")
def fetch_chats():
    """
    Gets all chats
    """
    return chat_db

@app.post("/chats")
def create_chat(chat: Chat):
    """
    Creates new group chat
    """
    chat_db.append(chat)
    return {"id": chat.chat_id}

@app.get("/users/{Chat}")
def display_chat(chat_id: int, chat_name: str):
    """
    Displays user profile
    """
    return {"user_id": chat_id, "username": chat_name}
