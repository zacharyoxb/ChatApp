"""
Imports List type.
Imports BaseModel class for use when routing
Imports APIRouter for routing.
"""
import uuid
from fastapi import APIRouter, WebSocket
from backend.app.database import db

router = APIRouter()

@router.get("/chats")
def fetch_chats():
    """
    Gets all chats
    """
    return db.get_chats()

@router.post("/chats")
def create_chat(name: str) -> None:
    """
    Creates new group chat
    """
    db.create_chat(name)

@router.get("/chats/{chat_id}")
def display_chat(chat_id: uuid.UUID):
    """
    Displays group chat
    """
    return {"chat_id": chat_id}

@router.websocket("/ws/{chat_id}") # this is defo silly
async def chat_websocket(websocket: WebSocket):
    """
    Recieves and sends back chat messages
    (this will be changed to exchange more data later)
    """
    await websocket.accept()
    while True:
        mssg = await websocket.receive_text()
        await websocket.send_text(mssg)
