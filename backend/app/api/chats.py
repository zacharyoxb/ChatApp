""" Handles the chat page - both chats preview and the chat itself """
from datetime import datetime
from typing import List

from fastapi import APIRouter, Cookie, HTTPException, Response, status
from pydantic import BaseModel

from app.services.myredis import redis_service
from app.services.mysqldb import db_service
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
async def create_new_chat(res: Response, _chat_name: str, session_id: str = Cookie(None)):
    """ Creates a new chat, adds users to chat """
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        remove_session_cookie(res)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")
