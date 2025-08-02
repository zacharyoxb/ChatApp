""" Methods involved with login """
from fastapi import APIRouter

router = APIRouter()

@router.post("/signup")
async def signup(_username: str, _password: str):
    """ Sends signup data to db """
    