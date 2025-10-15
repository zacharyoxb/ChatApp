""" Handles the chat page - both chats preview and the chat itself """
from datetime import datetime
from typing import List, Optional
import uuid

from fastapi import APIRouter, Cookie, HTTPException, Response, status
from pydantic import BaseModel

from app.services.myredis import redis_service
from app.services.mysqldb import CreateChatRequest, db_service
from app.utils.cookies import remove_session_cookie

router = APIRouter()


class ChatPreview(BaseModel):
    """ ChatPreview template """
    chat_id: int
    chat_name: str
    last_message_at: datetime


@router.get("/chats", response_model=List[ChatPreview])
async def get_user_chat_previews(res: Response, session_id: str = Cookie(None)):
    """ Gets all chats user is in """
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        remove_session_cookie(res)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")
    chat_tuples = await db_service.get_all_user_chats(session_data.get("user_id"))
    if not chat_tuples:
        return []
    # In future remember to change this to get the last message.
    return [ChatPreview(chat_id=chat_id, chat_name=chat_name, last_message_at=last_message_at)
            for chat_id, chat_name, last_message_at in chat_tuples]


@router.post("/chats")
async def create_new_chat(
        res: Response,
        chat_name: str,
        other_users: Optional[List[bytes]] = None,
        is_public: bool = False,
        session_id: str = Cookie(None)):
    """ Creates a new chat, adds the user and other_users to it. 

    Args:
        res (Response): FastAPI response
        chat_name (str): Name of the created chat.
        other_users (Optional[List[bytes]]): List of user_ids of users to add.
        is_public (bool): Whether the chat should be public or not.
        session_id (str, optional): The session_id of the user.. Defaults to Cookie(None).

    Raises:
        HTTPException: Exception thrown if the user's session has expired.
    """
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        remove_session_cookie(res)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")
    if other_users is None:
        other_users = []

    current_user_id = session_data.get("user_id")
    chat_id = uuid.uuid4().bytes

    create_request = CreateChatRequest(
        chat_id=chat_id,
        chat_name=chat_name,
        user_id=current_user_id,
        is_public=is_public,
        other_users=other_users
    )

    await db_service.create_chat(create_request)
