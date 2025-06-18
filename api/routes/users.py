"""
Imports List type.
Imports BaseModel class for use when routing
Imports APIRouter for routing.
"""

from typing import List
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter()

class User(BaseModel):
    """
    Holds user data
    """
    user_id: int
    username: str

# temporary db for testing
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

@router.get("/users")
def fetch_users():
    """
    Gets all users
    """
    return user_db

@router.post("/users")
def add_user(user: User):
    """
    Adds a user
    """
    user_db.append(user)
    return {"id": user.id}

@router.get("/users/{User}")
def display_profile(user_id: int, username: str):
    """
    Displays user profile
    """
    return {"user_id": user_id, "username": username}
