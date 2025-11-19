""" This is called by the frontend to check for a valid session. """
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status

from app.services.myredis import SessionData, redis_service

router = APIRouter()


async def auth_session(res: Response, session_id: str | None = Cookie(None)) -> SessionData:
    """ Authenticates the session cookie

    Args:
        response (Response): FastAPI response.
        session_id (str, optional): Session id. Defaults to Cookie.

    Raises:
        HTTPException: Exception thrown if the user's session has expired. If the cookie
            never existed, detail returns COOKIE_NOT_PRESENT. If the cookie existed but
            had an expired token returns SESSION_EXPIRED. (401 UNAUTHORIZED)

    Returns:
        SessionData: _description_
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
) -> None:
    """ Checks if the session id of the user is valid.

    Args:
        session_id (str, optional): The session id of the user. Defaults to Cookie(None).

    Raises:
        HTTPException: Exception thrown if the user's session has expired. (401 UNAUTHORIZED)
    """
    return {"message": "Session is valid"}
