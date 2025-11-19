""" This is called by the frontend to check for a valid session. """
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status

from app.services.myredis import SessionData, redis_service

router = APIRouter()


async def auth_session(res: Response, session_id: str | None = Cookie(None)) -> SessionData:
    """ Authenticates the session cookie and removes invalid cookies.

     Args:
         res (Response): FastAPI response object used to clear invalid session cookies.
         session_id (str | None): Session ID from the session cookie. Defaults to Cookie(None).

     Raises:
         HTTPException: 401 UNAUTHORIZED with detail:
         - "COOKIE_NOT_PRESENT" if no session cookie was provided
         - "SESSION_EXPIRED" if the session was found but has expired (cookie will be cleared)

     Returns:
         SessionData: The validated session data stored in Redis.
     """
    if session_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="COOKIE_NOT_PRESENT")

    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        res.delete_cookie(key="session_id")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="SESSION_EXPIRED")

    return session_data


@router.get("/session")
async def get_session_endpoint(
    _: SessionData = Depends(auth_session)
) -> dict:
    """ Validates the user's session authentication.

    This endpoint uses the auth_session dependency to verify that:
    - A session cookie is present
    - The session exists in Redis and is valid

    If authentication fails, the auth_session dependency will raise
    an appropriate HTTPException.

    Returns:
        dict: Confirmation message if session is valid.

    Raises:
        HTTPException: 401 UNAUTHORIZED if:
            - No session cookie provided ("COOKIE_NOT_PRESENT")
            - Session expired or invalid ("SESSION_EXPIRED")
    """
    return {"message": "Session is valid"}
