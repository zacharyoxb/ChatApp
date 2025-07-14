" Libraries for metadata, routing, maintaining ws connections and for use of auth cookies "
from typing import Annotated
from fastapi import APIRouter, WebSocket, Cookie, WebSocketDisconnect

router = APIRouter()

class ConnectionManager:
    """ Manages active websocket connections for each chat. """
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """ Connect new user """
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """ Disconnect user """
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """ Sends message only to specific websocket client """
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        """ Sends message to all chatters """
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("{chat_id}/ws")
async def chat_websocket(
    websocket: WebSocket,
    cookie: Annotated[str | None, Cookie()] = None,
    ):
    """
    Connects to chat
    """
    # instead of just getting the main manager, get this chat's manager here
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"You wrote: {data}", websocket)
            await manager.broadcast(f"Client #{cookie} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client #{cookie} left the chat")
