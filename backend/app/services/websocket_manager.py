""" Handles websocket connections """
import asyncio
import json
from typing import Optional
from fastapi import HTTPException, WebSocket, status
from app.services.myredis import SessionData, redis_service
from app.services.mysqldb import db_service
from app.templates.chats.responses import ChatMessage, WSChatMessageData, WebsocketMessage


class WebSocketConnectionManager:
    """ Class to handle WebSocket connections and manage chat subscriptions.

    Attributes:
        websocket (WebSocket): The WebSocket connection to manage
        session_data (SessionData): Session data for the authenticated user
        active_subscriptions (Dict[str, asyncio.Task]): Mapping of subscription IDs 
            (chat IDs or the userID) to their corresponding background tasks
        user_chat_ids (Set[str]): Set of chat IDs that the user is authorized to access
    """

    def __init__(self, websocket: WebSocket, session_data: SessionData):
        self.websocket = websocket
        self.session_data = session_data
        self.active_subscriptions = {}
        self.user_chat_ids = set()

    async def handle_connection(self):
        """ Main connection handling loop. """
        await self.initialize_subscriptions()

        while True:
            data = await self.websocket.receive_text()
            await self.handle_client_message(data)

    async def listen_for_messages(self, chat_id: str):
        """ Listens for Redis Pub/Sub messages via chat id and forwards them to the
        WebSocket client.

        Args:
            chat_id (str): The id of the redis channel to connect to.
            websocket (WebSocket): WebSocket connection to send messages to the client.

        Note:
            Runs continuously until the WebSocket connection is closed.
            Only processes messages of type 'message' from Redis.
        """
        async with redis_service.subscribe_to_channel(chat_id) as pubsub:
            # Handles backend -> frontend traffic
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    message_data = message['data']
                    raw_message = json.loads(message_data)

                    message_id = raw_message['message_id']
                    sender_id = raw_message['sender_id']
                    sender_username = raw_message['sender_username']
                    content = raw_message['content']
                    timestamp = raw_message['timestamp']

                    message_obj = ChatMessage(
                        message_id=message_id,
                        sender_id=sender_id,
                        sender_username=sender_username,
                        content=content,
                        timestamp=timestamp
                    )

                    ws_payload = WSChatMessageData(
                        chat_id=chat_id,
                        message=message_obj
                    )

                    full_message = WebsocketMessage(
                        type="message",
                        data=ws_payload
                    )

                    await self.websocket.send_json(full_message.model_dump(by_alias=True))

    async def listen_for_notifications(self):
        """ Listens for Redis Pub/Sub messages via user id and forwards them to the
        WebSocket client.
        """
        async with redis_service.subscribe_to_channel(self.session_data.user_id) as pubsub:
            # Handles backend -> frontend traffic
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    message_data = message['data']
                    raw_message = json.loads(message_data)
                    (message_id, sender_id, sender_username,
                        content, timestamp) = raw_message.values()

                    message_obj = ChatMessage(
                        message_id=message_id,
                        sender_id=sender_id,
                        sender_username=sender_username,
                        content=content,
                        timestamp=timestamp
                    )

                    message_data = {
                        "userId": self.session_data.user_id,
                        "message": message_obj.model_dump(by_alias=True)
                    }

                    await self.websocket.send_json(message_data)

    async def initialize_subscriptions(self):
        """ Set up initial Redis subscriptions for user chats and notifications."""
        previews = await db_service.get_all_user_chats(self.session_data.username)
        self.user_chat_ids = {preview.chat_id for preview in previews}

        # Subscribe to user-level notifications (add/remove from chats)
        await self.subscribe_to_user_notifications()

        # Subscribe to all user's chats
        for preview in previews:
            await self.subscribe_to_chat(preview.chat_id)

    async def subscribe_to_user_notifications(self):
        """ Subscribe to Redis channel for user-specific notifications."""
        task = asyncio.create_task(
            self.listen_for_notifications()
        )
        self.active_subscriptions[self.session_data.user_id] = task

    async def subscribe_to_chat(self, chat_id: str):
        """ Subscribe to a specific chat's Redis channel. """
        if chat_id in self.active_subscriptions:
            return  # Already subscribed

        task = asyncio.create_task(
            self.listen_for_messages(chat_id)
        )
        self.active_subscriptions[chat_id] = task

    async def unsubscribe_from_chat(self, chat_id: str):
        """ Unsubscribe from a chat's Redis channel. """
        if chat_id not in self.active_subscriptions:
            return

        self.active_subscriptions[chat_id].cancel()
        del self.active_subscriptions[chat_id]

    async def handle_client_message(self, raw_data: str):
        """ Process incoming messages from the client. """
        try:
            parsed_data = json.loads(raw_data)
            request_type = parsed_data.get("type")
            chat_id = parsed_data.get("chatId")

            handler = self.get_message_handler(request_type)
            if handler:
                await handler(chat_id, parsed_data)
            else:
                print(f"Unknown request type: {request_type}")

        except json.JSONDecodeError:
            print(f"Invalid JSON received: {raw_data}")

    def get_message_handler(self, request_type: str):
        """ Get the appropriate handler for the request type. """
        handlers = {
            "message": self.handle_message_request,
            "subscribe": self.handle_subscribe_request,
            "unsubscribe": self.handle_unsubscribe_request,
        }
        return handlers.get(request_type)

    async def handle_message_request(self, chat_id: str, data: dict):
        """ Handle incoming chat messages from client. """
        if chat_id not in self.user_chat_ids:
            print(
                f"User attempted to send message to unauthorized chat: {chat_id}")
            return

        content = data.get("content")
        if content:
            await redis_service.send_chat_message(
                chat_id,
                self.session_data.user_id,
                self.session_data.username,
                content
            )

    async def handle_subscribe_request(self, chat_id: str, _):
        """ Handle subscription requests to new chats. """
        if chat_id in self.active_subscriptions:
            print(f"Already subscribed to chat {chat_id}")
            return

        can_subscribe = await db_service.is_user_in_chat(
            self.session_data.username, chat_id
        )
        if can_subscribe:
            await self.subscribe_to_chat(chat_id)
            self.user_chat_ids.add(chat_id)
        else:
            print(
                f"User attempted to subscribe to unauthorized chat: {chat_id}")

    async def handle_unsubscribe_request(self, chat_id: str, _):
        """ Handle unsubscription requests from chats. """
        await self.unsubscribe_from_chat(chat_id)

    async def cleanup(self):
        """Clean up all subscriptions and tasks."""
        for task in self.active_subscriptions.values():
            task.cancel()

        if self.active_subscriptions:
            await asyncio.gather(
                *self.active_subscriptions.values(),
                return_exceptions=True
            )


async def authenticate_websocket(websocket: WebSocket) -> Optional[SessionData]:
    """Authenticate WebSocket connection using session cookie. """
    session_id = websocket.cookies.get("session_id")
    session_data: SessionData = await redis_service.get_session(session_id)

    if session_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session does not exist or has expired"
        )

    return session_data
