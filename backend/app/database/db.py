"""
UUID model for unique user/chat identifiers
dataclass for dataclass structure
"""
import uuid
from dataclasses import dataclass

@dataclass
class User():
    """
    Holds user data
    """
    user_id: uuid.UUID
    username: str

@dataclass
class Chat():
    """
    Holds group chat data
    """
    chat_id: uuid.UUID
    chat_name: str

# temporary 'dbs' for testing
chat_db = {}

user_db = {}

# Chat db methods
def create_chat(chat_name: str) -> None:
    """
    Creates chat and adds to db
    """
    chat_id = uuid.uuid4()
    chat_db[chat_id] = Chat(chat_id=chat_id, chat_name=chat_name)

def get_chat(chat_id: uuid.UUID) -> Chat | None:
    """
    Returns chat from db using chat_id
    """
    return chat_db.get(chat_id)

def get_chats() -> dict:
    """
    Returns all chats
    """
    return chat_db

# User db methods
def create_user(username: str) -> None:
    """
    Creates user and adds to db
    """
    user_id = uuid.uuid4()
    user_db[user_id] = User(user_id=user_id, username=username)

def get_user(user_id: uuid.UUID) -> User | None:
    """
    Returns user from db using user_id
    """
    return chat_db.get(user_id)

def get_users() -> dict:
    """
    Returns all users
    """
    return user_db
