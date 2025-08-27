""" Handles the chat page - both chats preview and the chat itself """
from fastapi import APIRouter, Cookie

from app.services.myredis import get_session

router = APIRouter()

@router.get("/chats")
async def get_chat_previews(session_id: str = Cookie(None)) -> dict[str, str]:
    """ Gets all chats user is in """
    username = await get_session(session_id)
