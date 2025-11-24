""" Handles the chat page - both chats preview and the chat itself """
import asyncio
from datetime import datetime
import json
from typing import List

from fastapi import (APIRouter, Depends, HTTPException,
                     Response, WebSocket, WebSocketDisconnect, status)

from app.api.session import auth_session
from app.services.myredis import SessionData, redis_service
from app.services.mysqldb import db_service
from app.templates.chats.requests import NewChatData
from app.templates.chats.responses import ChatDetails, ChatMessage, ChatPreview, UserRole

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
            chat.last_message = None
        else:
            if last_message_data.sender_id == "SERVER":
                last_sender_username = "SERVER"
            else:
                last_sender_username = await db_service.get_username(
                    bytes.fromhex(last_message_data.sender_id))
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


@router.get("/chats/{chat_id}", response_model=ChatDetails)
async def get_chat_details(
        chat_id: str,
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
    participants = await db_service.get_all_chat_participants(bytes.fromhex(chat_id))
    messages = await redis_service.get_chat_history(chat_id)

    user_id_to_username = {
        user.user_id: user.username for user in participants
    }

    for msg in messages:
        if msg.sender_id == "SERVER":
            msg.sender_username = "SERVER"
        else:

            msg.sender_username = (user_id_to_username.get(msg.sender_id)) or (
                await db_service.get_username(msg.sender_id))

    return ChatDetails(
        chat_id=chat_id,
        participants=participants,
        messages=messages
    )


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
        message_id=message_id,
        sender_id="SERVER",
        sender_username="SERVER",
        content=message_text,
        timestamp=datetime.now().isoformat()
    )

    return ChatPreview(
        chat_id=req.chat_id.hex(),
        chat_name=req.chat_name,
        dm_participant_id=None,
        last_activity=datetime.now().isoformat(),
        last_message=message,
        my_role=UserRole.OWNER
    )

# =============== WEBSOCKET METHODS ===============


async def listen_for_messages(chat_id: str, websocket: WebSocket):
    """ Listens for Redis Pub/Sub messages and forwards them to the WebSocket client.

    Args:
        pubsub: Redis Pub/Sub connection for receiving messages.
        websocket (WebSocket): WebSocket connection to send messages to the client.

    Note:
        Runs continuously until the WebSocket connection is closed.
        Only processes messages of type 'message' from Redis.
    """
    async with redis_service.subscribe_to_chat(chat_id) as pubsub:
        # Handles backend -> frontend traffic
        async for message in pubsub.listen():
            if message['type'] == 'message':
                message_data = message['data']
                raw_message = json.loads(message_data)
                (message_id, sender_id, sender_username,
                 content, timestamp) = raw_message.values()

                message_obj = ChatMessage(
                    message_id=message_id,
                    sender_id=sender_id,
                    sender_username=sender_username,
                    content=content,
                    timestamp=timestamp
                )

                message_data = {
                    "chatId": chat_id,
                    "message": message_obj.model_dump(by_alias=True)
                }

                await websocket.send_json(message_data)


@router.websocket("/ws/chats")
async def chat_websocket(websocket: WebSocket):
    """ Websocket endpoint for chats

    Args:
        websocket (WebSocket): WebSocket connection to send messages to the client.

    Raises:
        HTTPException: Exception thrown if the user's session has expired. (401 UNAUTHORIZED)
    """
    session_id = websocket.cookies.get("session_id")
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")

    previews = await db_service.get_all_user_chats(session_data.username)
    await websocket.accept()

    active_subscriptions = {}  # chat_id -> task
    user_chat_ids = set(preview.chat_id for preview in previews)

    for preview in previews:
        task = asyncio.create_task(
            listen_for_messages(preview.chat_id, websocket)
        )
        active_subscriptions[preview.chat_id] = task

    try:
        # Loop that handles websocket traffic from
        # frontend -> backend.
        while True:
            data = await websocket.receive_text()
            parsed_data = json.loads(data)

            request_type = parsed_data.get("type")
            chat_id = parsed_data.get("chatId")

            # check type of request
            if request_type == "message":
                content = parsed_data.get("content")

                if chat_id in user_chat_ids:
                    await redis_service.send_chat_message(
                        chat_id, session_data.user_id, session_data.username, content)
                else:
                    print(
                        f"User attempted to send message to unauthorized chat: {chat_id}")

            if request_type == "subscribe":
                # check user isn't already subscribed
                if chat_id in active_subscriptions:
                    print(f"Already subscribed to chat {chat_id}")
                    return
                # check user is in chat and can subscribe
                can_subscribe = await db_service.is_user_in_chat(session_data.username, chat_id)
                if can_subscribe:
                    task = asyncio.create_task(
                        listen_for_messages(chat_id, websocket)
                    )
                    active_subscriptions[chat_id] = task
                else:
                    print(
                        f"User attempted to subscribe to unauthorized chat: {chat_id}")

            if request_type == "unsubscribe":
                if chat_id not in active_subscriptions:
                    print(f"Not subscribed to chat {chat_id}")
                    return
                active_subscriptions[chat_id].cancel()
                del active_subscriptions[chat_id]

    except WebSocketDisconnect:
        pass
    finally:
        for task in active_subscriptions.values():
            task.cancel()
        if active_subscriptions:
            await asyncio.gather(*active_subscriptions.values(), return_exceptions=True)
