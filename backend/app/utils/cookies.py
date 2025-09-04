""" Standardises cookie defaults """
from fastapi import Response

def set_session_cookie(response: Response, session_id: str):
    """ Makes a session cookie, adds to response"""
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="none",
    )
