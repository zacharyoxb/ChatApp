""" Standardises cookie defaults """
from datetime import datetime, timedelta, timezone

from fastapi import Response

def set_session_cookie(response: Response, session_id: str):
    """ Makes a session cookie, adds to response"""
    expiry_time = datetime.now(timezone.utc) + timedelta(hours=1)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="none",
        expires=expiry_time,
    )
