""" Handles the chat page - both chats preview and the chat itself """
from typing import List
import uuid

from fastapi import APIRouter, Cookie, HTTPException, Response, status

from app.services.myredis import redis_service
from app.services.mysqldb import db_service
from app.api.templates.chats import NewChatData
from app.api.templates.chats import ChatListItem
from app.utils.cookies import remove_session_cookie

router = APIRouter()


@router.get("/chats/my-chats", response_model=List[ChatListItem])
async def get_user_chat_data(
    res: Response,
    session_id: str = Cookie(None)
) -> List[ChatListItem]:
    """ Gets all chats a user is in

    Args:
        res (Response): FastAPI response.
        session_id (str, optional): The session id of the user. Defaults to Cookie(None).

    Raises:
        HTTPException: Exception thrown if the user's session has expired.

    Returns:
        ChatListItem: An array of data in the ChatListItem template.
    """
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        remove_session_cookie(res)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")
    user_chats = await db_service.get_all_user_chats(session_data.username)

    # In future remember to change this to get the last message.
    return [
        ChatListItem(
            chat_id=chat.chat_id.hex(),
            chat_name=chat.chat_name,
            last_message_at=chat.last_message_at,
            other_user_id=(id_bytes := chat.other_user_id) and id_bytes.hex()
        )
        for chat in user_chats
    ]


@router.get("/chats/available-chats", response_model=List[ChatListItem])
async def get_available_chat_data(
    res: Response,
    session_id: str = Cookie(None)
) -> List[ChatListItem]:
    """ Gets chats the user isn't in, but are available to join
    (i.e. are public)

    Args:
        res (Response): FastAPI response.
        session_id (str, optional): The session id of the user. Defaults to Cookie(None).

    Raises:
        HTTPException: Exception thrown if the user's session has expired.

    Returns:
        ChatListItem: An array of data in the ChatListItem template.
    """
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        remove_session_cookie(res)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")
    user_chats = await db_service.get_all_user_chats(session_data.username)

    # In future remember to change this to get the last message.
    return [
        ChatListItem(
            chat_id=chat.chat_id.hex(),
            chat_name=chat.chat_name,
            last_message_at=chat.last_message_at,
            other_user_id=(id_bytes := chat.other_user_id) and id_bytes.hex()
        )
        for chat in user_chats
    ]


@router.post("/chats")
async def create_new_chat(
        req: NewChatData,
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

    create_request = NewChatData(
        chat_id=chat_id,
        chat_name=req.chat_name,
        username=username,
        is_public=req.is_public,
        other_users=req.other_users
    )

    await db_service.create_chat(create_request)
    res.status_code = status.HTTP_201_CREATED
