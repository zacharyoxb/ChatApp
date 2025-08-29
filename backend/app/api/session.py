""" This is called by the frontend to check for a valid session. """
from fastapi import APIRouter, Cookie, HTTPException, status

from app.services.myredis import get_session

router = APIRouter()

@router.get("/session")
async def get_session_endpoint(session_id: str = Cookie(None)) -> None:
    """ Checks if session id is still valid, returns No Content on success """
    username = await get_session(session_id)
    if username is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                             detail="Session expired or invalid")
    return None
