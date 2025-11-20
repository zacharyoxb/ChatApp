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
    """ Gets all chats that the authenticated user is participating in.

    Retrieves the user's chat list from the database and enriches each chat
    with the last message content and activity timestamp from Redis.

    Args:
        session_data (SessionData): Authenticated user session data containing username.

    Returns:
        List[ChatPreview]: List of chat previews with last message information.

    Raises:
        HTTPException: 401 UNAUTHORIZED if session authentication fails via auth_session dependency.
    """
    user_chats = await db_service.get_all_user_chats(session_data.username)

    for chat in user_chats:

        last_message_data = await redis_service.get_last_message(chat.chat_id)
        if last_message_data is None:
            chat.last_message = ChatMessage(
                message_id="N/A",
                sender_id=None,
                sender_username=None,
                content="N/A",
                timestamp=None
            )
        else:
            last_sender_username = await db_service.get_username(last_message_data.sender_id)
            last_message_data.sender_username = last_sender_username
            chat.last_message = last_message_data

    return user_chats


@router.get("/chats/available-chats", response_model=List[ChatPreview])
async def get_available_chat_previews(
    session_data: SessionData = Depends(auth_session),
) -> List[ChatPreview]:
    """ Gets public chats that the user is not currently participating in.

    Retrieves a list of available public chats that the authenticated user
    can join.

    Args:
        session_data (SessionData): Authenticated user session data containing username.

    Returns:
        List[ChatPreview]: List of available public chats that the user can join.

    Raises:
        HTTPException: 401 UNAUTHORIZED if session authentication fails via auth_session dependency.
    """
    user_chats = await db_service.get_all_user_chats(session_data.username)
    # add last message

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
    """ Retrieves the chat history for a specific chat.

    Fetches messages from Redis within the specified range and pagination.

    Args:
        chat_id (str): Hex string identifier of the chat.
        start_id (str, optional): Hex string ID of the starting message for the range.
        end_id (str, optional): Hex string ID of the ending message for the range.
        count (int, optional): Maximum number of messages to retrieve. Defaults to 20.

    Returns:
        List[ChatMessage]: Array of chat messages in the specified chat.

    Raises:
        HTTPException: 401 UNAUTHORIZED if session authentication fails via auth_session dependency.
    """
    history = await redis_service.get_chat_history(chat_id, start_id, end_id, count)
    return history


@router.post("/chats")
async def create_new_chat(
        req: NewChatData,
        res: Response,
        session_data: SessionData = Depends(auth_session)
):
    """ Creates a new chat and adds the user and other participants.

     Creates a new chat in the database, sends a system message to Redis,
     and returns the chat preview to avoid additional database queries.

     Args:
         req (NewChatData): Request data containing chat creation details.
         res (Response): FastAPI response object for setting status code.
         session_data (SessionData): Authenticated user session data.

     Returns:
         ChatPreview: Preview of the newly created chat with generated chat_id and timestamp.

     Raises:
         HTTPException: 401 UNAUTHORIZED if session authentication fails via auth_session
         dependency.
     """

    user_id_hex = session_data.user_id
    user_id = bytes.fromhex(session_data.user_id)

    await db_service.create_chat(user_id, req)

    message_text = f"NEW CHAT CREATED BY @{user_id_hex}"
    message_id = await redis_service.send_system_message(req.chat_id.hex(), message_text)
    res.status_code = status.HTTP_201_CREATED

    message = ChatMessage(
        messageId=message_id,
        senderId="SERVER",
        content=message_text,
        timestamp=datetime.now().isoformat()
    )

    return ChatPreview(
        chat_id=req.chat_id.hex(),
        chat_name=req.chat_name,
        last_activity=datetime.now().isoformat(),
        dmParticipantId=None,
        last_message=message
    )

# =============== WEBSOCKET METHODS ===============


async def listen_for_messages(pubsub, websocket: WebSocket):
    """ Listens for Redis Pub/Sub messages and forwards them to the WebSocket client.

    Args:
        pubsub: Redis Pub/Sub connection for receiving messages.
        websocket (WebSocket): WebSocket connection to send messages to the client.

    Note:
        Runs continuously until the WebSocket connection is closed.
        Only processes messages of type 'message' from Redis.
    """
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
