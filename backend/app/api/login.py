""" Handles POST requests for logging in, signing up and logging out. """
import uuid
from pydantic import BaseModel

from fastapi import APIRouter, Cookie, Response, HTTPException, status
import bcrypt
import mysql.connector
from mysql.connector import errorcode

from app.services.mysqldb import db_service
from app.services.myredis import redis_service
from app.utils.cookies import set_session_cookie, remove_session_cookie

router = APIRouter()

class SignupLoginRequest(BaseModel):
    """ Input required for sign in/login """
    username: str
    password: str

@router.post("/signup")
async def signup(req: SignupLoginRequest, res: Response) -> None:
    """ Sends signup data to db and returns cookie with session id if successful"""
    # generate unique id
    user_id = uuid.uuid4().bytes
    # hash the password
    pass_bytes = req.password.encode('utf-8')
    salt = bcrypt.gensalt()
    pass_hash = bcrypt.hashpw(pass_bytes, salt).decode()

    try:
        await db_service.add_user(user_id, req.username, pass_hash)
        session_id = await redis_service.create_session(req.username)
        set_session_cookie(res, session_id)
        res.status_code = status.HTTP_201_CREATED
    except mysql.connector.Error as e:
        if e.errno == errorcode.ER_DUP_ENTRY:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Username already exists") from e
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Database operation failed") from e

@router.post("/login")
async def login(req: SignupLoginRequest, res: Response) -> None:
    """ Checks user submitted login details and returns session id if successful """
    pass_hash = await db_service.get_password(req.username)

    if pass_hash is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Username or password is incorrect.")

    pass_bytes = req.password.encode('utf-8')
    hash_bytes = pass_hash.encode('utf-8')

    if not bcrypt.checkpw(pass_bytes, hash_bytes):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Username or password is incorrect.")

    session_id = await redis_service.create_session(req.username)
    set_session_cookie(res, session_id)
    res.status_code = status.HTTP_201_CREATED

@router.post("/logout")
async def logout(res: Response, session_id: str = Cookie(None)) -> None:
    """ Logs user out by deleting redis entry for session """
    if session_id is None:
        # cookie expired anyway, do nothing
        return
    await redis_service.delete_session(session_id)
    remove_session_cookie(res)
