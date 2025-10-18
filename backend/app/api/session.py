""" This is called by the frontend to check for a valid session. """
from fastapi import APIRouter, Cookie, HTTPException, status

from app.services.myredis import redis_service

router = APIRouter()


@router.get("/session")
async def get_session_endpoint(session_id: str = Cookie(None)) -> None:
    """ Checks if the session id of the user is valid.

    Args:
        session_id (str, optional): The session id of the user. Defaults to Cookie(None).

    Raises:
        HTTPException: Exception thrown if the user's session has expired. (401 UNAUTHORIZED)
    """
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session expired or invalid")
