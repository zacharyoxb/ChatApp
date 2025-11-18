""" Functions related to users / user information """
from fastapi import APIRouter, Cookie, HTTPException, status
import mysql
from pydantic import BaseModel, Field

from app.services.myredis import redis_service
from app.services.mysqldb import db_service

router = APIRouter()


class UserIdResponse(BaseModel):
    """ Response to send user_id of user as response

    Attributes:
        user_id: hex string of user_id
    """
    user_id: str = Field(..., alias="userId")

    class Config:
        """ Sets CreateChat Request Model to expect aliases from frontend """
        populate_by_name = True


@router.get("/users/{username}", response_model=UserIdResponse)
async def get_user_id(username: str, session_id: str = Cookie(None)) -> None:
    """ Check if a user with the given username exists.

    Returns 200 if they do, 404 if they don't.

    Args:
        username (str, optional): The username to check.
        session_id (str, optional): The session id of the user. Defaults to Cookie(None).

    Raises:
        HTTPException: Exception thrown if the user does not exist. (404 NOT FOUND)
        HTTPException: Exception thrown if the user's session has expired. (401 UNAUTHORIZED)
        HTTPException: Exception thrown if a database error occurs. (500 INTERNAL SERVER ERROR)
    """
    session_data = await redis_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session expired or invalid")

    try:
        user_id = await db_service.get_id_from_username(username)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist")
        return UserIdResponse(
            user_id=user_id.hex()
        )
    except mysql.connector.Error as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Database operation failed") from e
