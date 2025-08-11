""" Methods involved with login """
import uuid
from pydantic import BaseModel

from fastapi import APIRouter, Response, HTTPException
import bcrypt
import mysql.connector

from app.services.mysqldb import add_user, get_password
from app.services.redis import create_session
from app.utils.cookies import set_session_cookie

router = APIRouter()

class SignupLoginRequest(BaseModel):
    """ Input required for signin/login"""
    username: str
    password: str

@router.post("/signup")
async def signup(req: SignupLoginRequest, res: Response):
    """ Sends signup data to db and returns session id if successful"""
    # generate unique id
    user_id = uuid.uuid4().bytes
    # hash the password
    pass_bytes = req.password.encode('utf-8')
    salt = bcrypt.gensalt()
    pass_hash = bcrypt.hashpw(pass_bytes, salt).decode()

    try:
        await add_user(user_id, req.username, pass_hash)
        session_id = await create_session(req.username)
        set_session_cookie(res, session_id)
        return {"message": "Signed up successfully", "session_id": session_id}
    except mysql.connector.Error as e:
        if e.errno == 1062: # ERROR 1062 (23000): Duplicate entry
            raise HTTPException(status_code=400, detail="Username already exists") from e
        print(e.msg)
        raise HTTPException(status_code=500, detail="Database operation failed") from e

@router.post("/login")
async def login(req: SignupLoginRequest, res: Response):
    """ Checks user submitted login details and returns session id if successful """
    pass_hash = await get_password(req.username)

    if pass_hash is None:
        raise HTTPException(status_code=401, detail="Username or password is incorrect.")

    pass_bytes = req.password.encode('utf-8')
    hash_bytes = pass_hash.encode('utf-8')

    if not bcrypt.checkpw(pass_bytes, hash_bytes):
        raise HTTPException(status_code=401, detail="Username or password is incorrect.")

    session_id = await create_session(req.username)
    set_session_cookie(res, session_id)
    return {"message": "Signed in successfully", "session_id": session_id}
