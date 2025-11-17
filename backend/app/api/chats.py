""" Handles the chat page - both chats preview and the chat itself """
from datetime import datetime
from typing import List

from fastapi import APIRouter, Cookie, HTTPException, Response, WebSocket, status
from fastapi.params import Query

from app.services.myredis import redis_service
from app.services.mysqldb import db_service
from app.templates.chats.requests import ChatHistoryRequest, NewChatData
from app.templates.chats.responses import ChatMessage, ChatPreview
from app.utils.cookies import remove_session_cookie

router = APIRouter()


@router.get("/chats/my-chats", response_model=List[ChatPreview])
async def get_chat_previews(
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
        ChatListItem: An array of data in the ChatListItem template.
    """
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        remove_session_cookie(res)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")
    user_chats = await db_service.get_all_user_chats(session_data.username)

    for chat in user_chats:
        chat.last_message = "temp message"
        chat.last_activity = datetime.now()

    return user_chats


@router.get("/chats/available-chats", response_model=List[ChatPreview])
async def get_available_chat_previews(
    res: Response,
    session_id: str = Cookie(None)
) -> List[ChatPreview]:
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

    return user_chats


@router.get("/chats/{chat_id}", response_model=List[ChatMessage])
async def get_chat_history(
        res: Response,
        chat_id: str,
        start_id: str = Query(
            None, description="Hex string for the id of the start message"),
        end_id: str = Query(
            None, description="Hex string for the id of the end message"),
        count: int = Query(15, description="Number of messages to retrieve"),
        session_id: str = Cookie(None)):
    """ Gets the chat history for a given chat

    Args:
       res (Response): FastAPI response.
       chat_id (str): Hex string for the id of the chat.
       start_id (str, optional): Hex string for the id of the start message. Defaults to None.
       end_id (str, optional): Hex string for the id of the end message. Defaults to None.
       count (int, optional): Number of messages to retrieve. Defaults to 15.
       session_id (str, optional): The session id of the user. Defaults to Cookie(None). 

    Raises:
        HTTPException: Exception thrown if the user's session has expired. (401 UNAUTHORIZED)

    Returns:
        List[Message]: An array of chat messages in the chat.
    """
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        remove_session_cookie(res)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")
    history = await redis_service.get_chat_history(chat_id, start_id, end_id, count)
    return history


@router.post("/chats")
async def create_new_chat(
        req: NewChatData,
        res: Response,
        session_id: str = Cookie(None)):
    """ Creates a new chat, adds the user and other_users to it. Returns the generated
    chat_id and the time the chat was created so the frontend can add the chat to the
    list without doing another costly db fetch.

    Args:
        req (NewChatData): Request data for creating new chat.
        res (Response): FastAPI response.
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

    await db_service.create_chat(username, req)
    res.status_code = status.HTTP_201_CREATED

    return ChatPreview(
        chat_id=req.chat_id.hex(),
        chat_name=req.chat_name,
        last_activity=datetime.now(),
        dmParticipantId=None,
        last_message=None
    )


@router.websocket("/ws/chats/{chat_id}")
async def websocket_chat(
        websocket: WebSocket,
        chat_id: str):
    """ Websocket endpoint for chats

    Args:
        websocket (WebSocket): WebSocket for frontend communication.
        chat_id (str): Hex string for the id of the chat.

    Raises:
        HTTPException: Exception thrown if the user's session has expired. (401 UNAUTHORIZED)
    """
    # This cookie check is probably not super secure, but it's better than nothing
    session_id = websocket.cookies.get("session_id")
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")
    # here we ought to make sure the user is part of the chat, but I don't
    # want to overcomplicate things rn
    await websocket.accept()

    # leave it here for testing
