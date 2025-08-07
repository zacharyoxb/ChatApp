""" Methods involved with login """
import uuid
from pydantic import BaseModel

from fastapi import APIRouter, Response, HTTPException
import bcrypt
import mysql.connector

from app.services.mysqldb import add_user
from app.services.redis import create_session

router = APIRouter()

class SignupLoginRequest(BaseModel):
    """ Input required for signin/login"""
    username: str
    password: str

@router.post("/signup")
async def signup(req: SignupLoginRequest, res: Response):
    """ Sends signup data to db """
    # generate unique id
    user_id = uuid.uuid4().bytes
    # hash the password
    pass_bytes = req.password.encode('utf-8')
    salt = bcrypt.gensalt()
    pass_hash = bcrypt.hashpw(pass_bytes, salt).decode()

    try:
        add_user(user_id, req.username, pass_hash)
        session_id = await create_session(req.username)
        res.set_cookie(key = "session_id", value=session_id)
        return {"message": "Signed up successfully", "session_id": session_id}
    except mysql.connector.Error as e:
        if e.errno == 1062: # ERROR 1062 (23000): Duplicate entry
            raise HTTPException(status_code=400, detail="Username already exists") from e
        raise HTTPException(status_code=500, detail="Database operation failed") from e
