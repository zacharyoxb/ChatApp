""" This is called by the frontend to check for a valid session. """
from fastapi import APIRouter, Cookie, HTTPException

from app.services.myredis import get_session

router = APIRouter()

@router.get("/session")
async def get_session_endpoint(session_id: str = Cookie(None)) -> dict[str, str]:
    """ Checks if session id is still valid, returns username """
    username = await get_session(session_id)
    if username is None:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return
