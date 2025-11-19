""" Handles the chat page - both chats preview and the chat itself """
import asyncio
from datetime import datetime
import json
from typing import List

from fastapi import (APIRouter, Depends, HTTPException,
                     Response, WebSocket, WebSocketDisconnect, status)
from fastapi.params import Query

from app.api.session import auth_session
from app.services.myredis import SessionData, redis_service
from app.services.mysqldb import db_service
from app.templates.chats.requests import NewChatData
from app.templates.chats.responses import ChatMessage, ChatPreview

router = APIRouter()


@router.get("/chats/my-chats", response_model=List[ChatPreview])
async def get_chat_previews(
    session_data: SessionData = Depends(auth_session)
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
    user_chats = await db_service.get_all_user_chats(session_data.username)

    for chat in user_chats:
        last_message_data = await redis_service.get_last_message(chat.chat_id)

        if last_message_data is None:
            chat.last_message = None
            chat.last_activity = None
        else:
            chat.last_message = last_message_data.content
            chat.last_activity = last_message_data.timestamp

    return user_chats


@router.get("/chats/available-chats", response_model=List[ChatPreview])
async def get_available_chat_previews(
    session_data: SessionData = Depends(auth_session),
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
    user_chats = await db_service.get_all_user_chats(session_data.username)

    return user_chats


@router.get("/chats/{chat_id}", response_model=List[ChatMessage])
async def get_chat_history(
        chat_id: str,
        start_id: str = Query(
            None, description="Hex string for the id of the start message"),
        end_id: str = Query(
            None, description="Hex string for the id of the end message"),
        count: int = Query(20, description="Number of messages to retrieve"),
        _: SessionData = Depends(auth_session)
):
    """ Gets the chat history for a given chat

    Args:
       res (Response): FastAPI response.
       chat_id (str): Hex string for the id of the chat.
       start_id (str, optional): Hex string for the id of the start message. Defaults to None.
       end_id (str, optional): Hex string for the id of the end message. Defaults to None.
       count (int, optional): Number of messages to retrieve. Defaults to 20.
       session_id (str, optional): The session id of the user. Defaults to Cookie(None).

    Raises:
        HTTPException: Exception thrown if the user's session has expired. (401 UNAUTHORIZED)

    Returns:
        List[Message]: An array of chat messages in the chat.
    """
    history = await redis_service.get_chat_history(chat_id, start_id, end_id, count)
    return history


@router.post("/chats")
async def create_new_chat(
        req: NewChatData,
        res: Response,
        session_data: SessionData = Depends(auth_session)
):
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

    user_id_hex = session_data.user_id
    user_id = bytes.fromhex(session_data.user_id)

    await db_service.create_chat(user_id, req)
    await redis_service.send_system_message(req.chat_id.hex(),
                                            f"NEW CHAT CREATED BY @{user_id_hex}")
    res.status_code = status.HTTP_201_CREATED

    return ChatPreview(
        chat_id=req.chat_id.hex(),
        chat_name=req.chat_name,
        last_activity=datetime.now().isoformat(),
        dmParticipantId=None,
        last_message=None
    )

# =============== WEBSOCKET METHODS ===============


async def listen_for_messages(pubsub, websocket: WebSocket):
    """Listen for messages from Redis Pub/Sub and send them to the WebSocket"""
    async for message in pubsub.listen():
        if message['type'] == 'message':
            message_data = message['data']
            raw_message = json.loads(message_data)
            (message_id, sender_id, content, timestamp) = raw_message.values()

            message_obj = ChatMessage(
                message_id=message_id,
                sender_id=sender_id,
                content=content,
                timestamp=timestamp
            )
            await websocket.send_json(message_obj.model_dump_json(by_alias=True))


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

    async with redis_service.subscribe_to_chat(chat_id) as pubsub:
        listen_task = asyncio.create_task(
            listen_for_messages(pubsub, websocket))

        try:
            while True:
                data = await websocket.receive_text()
                parsed_data = json.loads(data)
                content = parsed_data.get("content")
                await redis_service.send_chat_message(
                    chat_id, session_data.user_id, content)
        except WebSocketDisconnect:
            print(f"WebSocket for chat {chat_id} disconnected")
        finally:
            listen_task.cancel()
            try:
                await listen_task
            except asyncio.CancelledError:
                pass
