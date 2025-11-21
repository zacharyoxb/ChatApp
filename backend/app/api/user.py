""" Functions related to users / user information """
from fastapi import APIRouter, Depends, HTTPException, status
import mysql

from app.api.session import auth_session
from app.services.myredis import SessionData
from app.services.mysqldb import db_service
from app.templates.chats.responses import UserInfo, UserRole

router = APIRouter()


@router.get("/users/{username}", response_model=UserInfo)
async def get_user_id(
    username: str,
    _: SessionData = Depends(auth_session)
) -> None:
    """ Checks if a user with the given username exists and returns their user ID.

    Args:
        username (str): The username to look up.

    Returns:
        UserIdResponse: The user ID in hexadecimal format if the user exists.

    Raises:
        HTTPException: 404 NOT FOUND if the user does not exist.
        HTTPException: 401 UNAUTHORIZED if session authentication fails.
        HTTPException: 500 INTERNAL SERVER_ERROR if a database error occurs.
    """
    try:
        user_id = await db_service.get_user_id(username)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist")
        return UserInfo(
            user_id=user_id.hex(),
            username=username,
            role=UserRole.MEMBER
        )
    except mysql.connector.Error as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Database operation failed") from e
