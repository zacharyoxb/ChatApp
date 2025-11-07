""" Handles the chat page - both chats preview and the chat itself """
from datetime import datetime
from typing import List
import uuid

from fastapi import APIRouter, Cookie, HTTPException, Response, status
from pydantic import BaseModel

from app.services.myredis import redis_service
from app.services.mysqldb import CreateChatRequest, db_service
from app.utils.cookies import remove_session_cookie

router = APIRouter()


class ChatPreview(BaseModel):
    """ Data structure for chat preview information.

    Attributes:
        chat_id (bytes): Unique identifier for the chat.
        chat_name (str): Display name of the chat.
        last_message_at (datetime): Timestamp of the most recent message.
    """
    chat_id: bytes
    chat_name: str
    last_message_at: datetime


class CreateChatRequestModel(BaseModel):
    """ Data structure for data used to create a new chat.

    Attributes:
        chat_name (str): Name of the chat
        other_users (List[str]): All other users to add to chat. May be empty.
        is_public (bool): If the chat is public.
    """
    chat_name: str
    other_users: List[str]
    is_public: bool


@router.get("/chats", response_model=List[ChatPreview])
async def get_user_chat_previews(
    res: Response,
    session_id: str = Cookie(None)
) -> List[ChatPreview]:
    """ Gets all chats a user is in

    Args:
        res (Response): FastAPI response.
        session_id (str, optional): The session id of the user. Defaults to Cookie(None).

    Raises:
        HTTPException: Exception thrown if the user's session has expired.

    Returns:
        ChatPreview: An array of data in the ChatPreview template.
    """
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        remove_session_cookie(res)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")
    user_chats = await db_service.get_all_user_chats(session_data.username)

    # In future remember to change this to get the last message.
    return [
        ChatPreview(
            chat_id=chat.chat_id,
            chat_name=chat.chat_name,
            last_message_at=chat.last_message_at
        )
        for chat in user_chats
    ]


@router.post("/chats")
async def create_new_chat(
        req: CreateChatRequestModel,
        res: Response,
        session_id: str = Cookie(None)):
    """ Creates a new chat, adds the user and other_users to it. 

    Args:
        res (Response): FastAPI response
        chat_name (str): Name of the created chat.
        other_users (List[str]): List of user_ids of users to add.
        is_public (bool): Whether the chat should be public or not. Defaults to False.
        session_id (str, optional): The session id of the user. Defaults to Cookie(None).

    Raises:
        HTTPException: Exception thrown if the user's session has expired. (401 UNAUTHORIZED)
    """
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        remove_session_cookie(res)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")

    username = session_data.username
    chat_id = uuid.uuid4().bytes

    create_request = CreateChatRequest(
        chat_id=chat_id,
        chat_name=req.chat_name,
        username=username,
        is_public=req.is_public,
        other_users=req.other_users
    )

    await db_service.create_chat(create_request)
