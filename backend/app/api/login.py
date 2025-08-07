""" Methods involved with login """
import uuid
from pydantic import BaseModel

from fastapi import APIRouter, Response, HTTPException
import bcrypt
import mysql.connector

from app.services.mysqldb import get_connection
from app.services.redis import create_session

router = APIRouter()

class SignupLoginRequest(BaseModel):
    """ Input required for signin/login"""
    username: str
    password: str

@router.post("/signup")
async def signup(req: SignupLoginRequest, res: Response):
    """ Sends signup data to db """
    con = get_connection()

    if con is None:
        raise HTTPException(status_code=500, detail="Database connection failed.")

    # generate unique id
    user_id = uuid.uuid4().bytes
    # hash the password
    pass_bytes = req.password.encode('utf-8')
    salt = bcrypt.gensalt()
    pass_hash = bcrypt.hashpw(pass_bytes, salt).decode()

    try:
        cursor = con.cursor(prepared=True)
        query = "INSERT INTO users (user_id, user_name, pass_hash) VALUES (%s, %s, %s)"
        cursor.execute(query, (user_id, req.username, pass_hash))
        con.commit()
        cursor.close()
        con.close()

        session_id = create_session(req.username)
        res.set_cookie(key = "session_id", value=session_id)
        return {"message": "Signed up successfully", "session_id": session_id}
    except mysql.connector.Error as e:
        if e.errno == 1062: # ERROR 1062 (23000): Duplicate entry
            raise HTTPException(status_code=400, detail="Username already exists") from e
        raise HTTPException(status_code=500, detail="Database operation failed") from e
