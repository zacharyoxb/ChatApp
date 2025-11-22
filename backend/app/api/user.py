""" Functions related to users / user information """
import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
import mysql

from app.api.session import auth_session
from app.services.myredis import SessionData, redis_service
from app.services.mysqldb import db_service
from app.templates.chats.responses import UserInfo, UserRole

router = APIRouter()


@router.get("/users/{username}", response_model=UserInfo)
async def get_new_user_template(
    username: str,
    _: SessionData = Depends(auth_session)
) -> None:
    """ Returns a UserInfo entry for a user being added to a new chat/

    Args:
        username (str): The username of the user to make a UserInfo entry of. 

    Returns:
       UserInfo: UserInfo entry for user. 

    Raises:
        HTTPException: 401 UNAUTHORIZED if session authentication fails.
        HTTPException: 404 NOT FOUND if the user does not exist.
        HTTPException: 500 INTERNAL SERVER_ERROR if a database error occurs.
    """
    try:
        user_id = await db_service.get_user_id(username)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist")
        return UserInfo(
            user_id=user_id.hex(),
            username=username,
            role=UserRole.MEMBER
        )
    except mysql.connector.Error as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Database operation failed") from e


@router.websocket("/ws/users/{user_id}")
async def notification_websocket(websocket: WebSocket, user_id: str):
    """ Websocket endpoint for chats

    Args:
        websocket (WebSocket): WebSocket for frontend communication.
        user_id (str): Hex string for the id of the user.

    Raises:
        HTTPException: Exception thrown if the user's session has expired. (401 UNAUTHORIZED)
    """
    session_id = websocket.cookies.get("session_id")
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")

    await websocket.accept()

    async with redis_service.subscribe_to_chat(user_id) as pubsub:
        listen_task = asyncio.create_task(
            redis_service.listen_for_messages(pubsub, websocket))

        try:
            while True:
                data = await websocket.receive_text()
                parsed_data = json.loads(data)
                content = parsed_data.get("content")
                await redis_service.send_chat_message(
                    user_id, session_data.user_id, content)
        except WebSocketDisconnect:
            pass
        finally:
            listen_task.cancel()
            try:
                await listen_task
            except asyncio.CancelledError:
                pass
