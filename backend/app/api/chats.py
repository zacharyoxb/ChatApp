""" Handles the chat page - both chats preview and the chat itself """
from datetime import datetime
from typing import List

from fastapi import (APIRouter, Depends,
                     Response, WebSocket, WebSocketDisconnect, status)

from app.api.session import auth_session
from app.services.myredis import SessionData, redis_service
from app.services.mysqldb import db_service
from app.services.websocket_manager import WebSocketConnectionManager, authenticate_websocket
from app.templates.chats.requests import NewChatData
from app.templates.chats.responses import (
    ChatDetails, ChatMessage, ChatPreview, UserRole)

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
                await db_service.get_username(msg.sender_id.encode()))

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

    created_at = await db_service.create_chat(user_id, req)

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

    chat_preview = ChatPreview(
        chat_id=req.chat_id.hex(),
        chat_name=req.chat_name,
        created_at=created_at.isoformat(),
        dm_participant_id=None,
        last_message=message,
        my_role=UserRole.OWNER
    )

    chat_preview_users = chat_preview
    chat_preview_users.my_role = UserRole.MEMBER

    # notify user that they have been subscribed to new chat
    await redis_service.send_added_to_chat_notification(
        user_id_hex, chat_preview, user_id_hex)

    # notify other users about the new chat
    for other_user in req.other_users:
        await redis_service.send_added_to_chat_notification(
            other_user.user_id, chat_preview_users, user_id_hex)

    return {"status": "success", "chat_id": chat_preview.chat_id}

# =============== WEBSOCKET METHODS ===============


@router.websocket("/ws/chats")
async def chat_websocket(websocket: WebSocket):
    """ Websocket endpoint for all chat related notifications."""
    # Authentication and setup
    session_data = await authenticate_websocket(websocket)
    if not session_data:
        return

    await websocket.accept()

    # Initialize connection state
    connection_manager = WebSocketConnectionManager(
        websocket=websocket,
        session_data=session_data
    )

    try:
        await connection_manager.handle_connection()
    except WebSocketDisconnect:
        pass
    finally:
        await connection_manager.cleanup()
