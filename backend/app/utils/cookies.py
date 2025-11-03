""" Standardises cookie defaults """
from fastapi import Response


def set_session_cookie(response: Response, session_id: str):
    """ Makes a session cookie, adds to response. 

    Args:
        response (Response): FastAPI response.
        session_id (str): The session id of the user. 
    """
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="none",
    )


def remove_session_cookie(response: Response):
    """ Sets the session cookie to expire immediately so the browser removes it.

    Args:
        response (Response): FastAPI response.
    """
    response.set_cookie(
        key="session_id",
        value="",
        max_age=0,
        expires=0,
        httponly=True,
        secure=True,
        samesite="none"
    )
