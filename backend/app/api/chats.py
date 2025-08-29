""" Handles the chat page - both chats preview and the chat itself """
from typing import List

from fastapi import APIRouter, Cookie, HTTPException, status
from pydantic import BaseModel

from app.services.myredis import get_session
from app.services.mysqldb import get_all_chats

router = APIRouter()

class ChatPreview(BaseModel):
    """ ChatPreview template """
    chat_id: int
    chat_name: str

@router.get("/chats", response_model=List[ChatPreview])
async def get_chat_previews(session_id: str = Cookie(None)):
    """ Gets all chats user is in """
    username = await get_session(session_id)
    if username is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session does not exist or has expired")
    chat_tuples = await get_all_chats(username)
    if not chat_tuples:
        return []
    return [ChatPreview(chat_id=chat_id, chat_name=chat_name)
            for chat_id, chat_name in chat_tuples]

@router.post("/chats")
async def create_new_chat(_session_id: str = Cookie(None)):
    """ Creates a new chat, adds users to chat """
