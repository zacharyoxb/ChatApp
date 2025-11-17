""" Accesses redis for sessions / pubsub functionality """
from contextlib import asynccontextmanager
from datetime import datetime
import time
from typing import Optional
import uuid

from pydantic import BaseModel
from redis import Redis
import redis.asyncio as redis

from app.templates.chats.responses import ChatMessage

SESSION_TTL_SECONDS = 86400  # 24 hours


class SessionData(BaseModel):
    """ Data structure for session information.

    Attributes:
        user_id (str): User's unique identifier.
        username (str): Username for user.
        created_at (float): Unix timestamp for when user was created.
        last_activity (float): Unix timestamp for the user's most recent activity.
    """
    user_id: str
    username: str
    created_at: float
    last_activity: float


class RedisService:
    """ Singleton instance holding the redis connection. """
    _instance: Optional['RedisService'] = None
    _redis_conn: Optional[Redis] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def init_redis(self, redis_config: dict) -> None:
        """ Initialises redis/valkey 

        Args:
            redis_config (dict): Redis configuration provided by service_configs.
        """
        self._redis_conn = redis.Redis(**redis_config)

    # =============== SESSION METHODS ===============
    async def create_session(self, user_id: bytes, username: str) -> str:
        """ Creates a session and returns a session cookie. 

        Args:
            user_id (bytes): The id of the user.
            username (str): The username of the user.

        Returns:
            str: The session id of the session.
        """
        session_id = str(uuid.uuid4())
        session_data = SessionData(
            user_id=user_id.hex(),
            username=username,
            created_at=time.time(),
            last_activity=time.time()
        )

        await self._redis_conn.hset(
            f"session:{session_id}",
            mapping=session_data.model_dump()
        )

        await self._redis_conn.expire(f"session:{session_id}", SESSION_TTL_SECONDS)

        return session_id

    async def get_session(self, session_id: str) -> Optional[SessionData]:
        """ Gets the session associated with the session id.

        Args:
            session_id (str): The session id of the session.

        Returns:
            Optional[SessionData]: Returns the dictionary associated with the session id, 
            or None if the session does not exist/has expired.
        """
        session_key = f"session:{session_id}"
        session_data = await self._redis_conn.hgetall(session_key)

        if not session_data:
            return None

        return SessionData(
            user_id=session_data["user_id"],
            username=session_data["username"],
            created_at=float(session_data["created_at"]),
            last_activity=float(session_data["last_activity"])
        )

    async def delete_session(self, session_id: str) -> None:
        """ Deletes session if exists

        Args:
            session_id (str): The session id of the session. 
        """
        session_key = f"session:{session_id}"
        await self._redis_conn.delete(session_key)

    # =============== CHAT METHODS ===============

    @asynccontextmanager
    async def subscribe_to_chat(self, chat_id: str):
        """ Context manager for subscribing to chat Pub/Sub

        Args:
            chat_id (str): The id of the chat being subscribed to.

        Yields:
            PubSub: Redis pubsub instance. 
        """
        pubsub = self._redis_conn.pubsub()
        try:
            await pubsub.subscribe(f"chat:{chat_id}")
            yield pubsub
        finally:
            await pubsub.unsubscribe(f"chat:{chat_id}")
            await pubsub.close()

    async def send_system_message(self, chat_id: str, message: str) -> str:
        """ Logs a system message to the chat's stream then sends via Redis PubSub.
        Args:
            chat_id (str): Hex id of the chat to send the message to.

        Returns:
            str: Id of the message just sent.
        """
        message = {
            "user_id": "SERVER",
            "message": message,
            "timestamp": datetime.now().isoformat()
        }

        # log message to redis
        message_id = await self._redis_conn.xadd(chat_id, message)
        # publish for online users
        await self._redis_conn.publish(chat_id, message)

        return message_id

    async def send_chat_message(self, chat_id: str, user_id: str, message: str):
        """ Log a message to the chat's stream.

        Args:
            chat_id (str): Hex id of the chat which the stream will contain.
            user_id (str): Hex id of the subscribing user.
            message (str): Message to send. 

        Returns:
            str: Id of the message just sent.
        """
        message = {
            "user_id": user_id,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }

        # log message to redis
        message_id = await self._redis_conn.xadd(chat_id, message)
        # publish for online users
        await self._redis_conn.publish(chat_id, message)

        return message_id

    async def get_chat_history(
        self,
        chat_id: str,
        start_id: Optional[str] = None,
        end_id: Optional[str] = None,
        count: int = 15,
    ) -> list[ChatMessage]:
        """ Gets history of chat

        Args:
            chat_id (str): The id of the chat stream
            start_id (Optional[str]): Starting message ID (inclusive). Defaults to earliest.
            end_id (Optional[str]): Ending message ID (inclusive). Defaults to latest. 
            count (int): Amount of messages to retrieve. Defaults to 15.
        """

        min_range = start_id if start_id is not None else "-"
        max_range = end_id if end_id is not None else "+"

        messages = await self._redis_conn.xrange(chat_id, min_range, max_range, count)

        # this is ai generated and probably wrong as looking at the
        # redis-py github I don't think this is how the parser stores the RESP3
        # strings. In hindsight I should have done frontend first: fix this
        # after I can test it via frontend.
        formatted_messages = []
        for msg_id, fields in messages:
            formatted_messages.append(ChatMessage(
                message_id=msg_id.decode(),
                user_id=fields.get(b"user_id", b"").decode(),
                message=fields.get(b"message", b"").decode(),
                timestamp=float(fields.get(b"timestamp", time.time())),
            ))

        return formatted_messages


redis_service = RedisService()
