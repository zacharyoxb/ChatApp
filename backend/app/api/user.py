""" Functions related to users / user information """
from fastapi import APIRouter, Depends, HTTPException, status
import mysql

from app.api.session import auth_session
from app.services.myredis import SessionData
from app.services.mysqldb import db_service
from app.templates.chats.responses import UserInfo, UserRole

router = APIRouter()


@router.get("/users/{username}", response_model=UserInfo)
async def get_new_user_template(
    username: str,
    _: SessionData = Depends(auth_session)
) -> None:
    """ Returns a UserInfo entry for a user being added to a new chat/

    Args:
        username (str): The username of the user to make a UserInfo entry of. 

    Returns:
       UserInfo: UserInfo entry for user. 

    Raises:
        HTTPException: 401 UNAUTHORIZED if session authentication fails.
        HTTPException: 404 NOT FOUND if the user does not exist.
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
