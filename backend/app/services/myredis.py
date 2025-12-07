""" Accesses redis for sessions / pubsub functionality """
from contextlib import asynccontextmanager
from datetime import datetime
import json
import time
from typing import Optional
import uuid

from pydantic import BaseModel
from redis.asyncio import ConnectionPool, Redis
import redis.asyncio as redis

from app.templates.chats.responses import ChatMessage, ChatPreview

SESSION_TTL_SECONDS = 86400  # 24 hours


class SessionData(BaseModel):
    """ Data structure for session information.

    Attributes:
        user_id (str): User's unique identifier.
        username (str): Username for user.
        created_at (float): Unix timestamp for when user session was created.
        last_activity (float): Unix timestamp for the user's most recent activity.
    """
    user_id: str
    username: str
    created_at: float
    last_activity: float


class RedisService:
    """ Singleton instance holding the redis connection. """
    _instance: Optional['RedisService'] = None
    _sessions_pool: Optional[ConnectionPool] = None
    _streams_pool: Optional[ConnectionPool] = None
    _sessions_redis: Optional[Redis] = None
    _streams_redis: Optional[Redis] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def init_redis(self, session_redis_config: dict, streams_redis_config: dict) -> None:
        """ Initialises redis/valkey 

        Args:
            redis_config (dict): Redis configuration provided by service_configs.
        """
        self._sessions_pool = ConnectionPool(**session_redis_config)
        self._streams_pool = ConnectionPool(**streams_redis_config)

        self._sessions_redis = redis.Redis(connection_pool=self._sessions_pool)
        self._streams_redis = redis.Redis(connection_pool=self._streams_pool)

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

        await self._sessions_redis.hset(
            f"session:{session_id}",
            mapping=session_data.model_dump()
        )

        await self._sessions_redis.expire(f"session:{session_id}", SESSION_TTL_SECONDS)

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

        session_data = await self._sessions_redis.hgetall(session_key)

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

        await self._sessions_redis.delete(session_key)

    # =============== CHAT METHODS ===============

    @asynccontextmanager
    async def subscribe_to_channel(self, channel_id: str):
        """ Context manager for subscribing to Pub/Sub channels

        Args:
            channel_id (str): The id of the channel being subscribed to.

        Yields:
            PubSub: Redis pubsub instance. 
        """
        pubsub = self._streams_redis.pubsub()
        try:
            await pubsub.subscribe(channel_id)
            yield pubsub
        finally:
            await pubsub.unsubscribe(channel_id)
            await pubsub.close()

    async def send_system_message(self, chat_id: str, message: str) -> str:
        """ Logs a system message to the chat's stream then sends via Redis PubSub.
        Args:
            chat_id (str): Hex id of the chat to send the message to.

        Returns:
            str: Id of the message just sent.
        """
        message_dict = {
            "sender_id": "SERVER",
            "content": message,
            "timestamp": datetime.now().isoformat()
        }
        message_id = await self._streams_redis.xadd(chat_id, message_dict)

        pubsub_mssg = {
            "type": "message",
            "message_id": message_id,
            "sender_id": "SERVER",
            "sender_username": "SERVER",
            "content": message,
            "timestamp": message_dict["timestamp"]
        }
        message_json = json.dumps(pubsub_mssg)
        await self._streams_redis.publish(chat_id, message_json)

        return message_id

    async def send_chat_message(
            self,
            chat_id: str,
            sender_id: str,
            sender_username: str,
            message: str
    ) -> str:
        """ Log a message to the chat's stream.

        Note - The username is only sent to the pubsub service, when the message
        is logged to the stream the sender is only identified by id. This makes sure
        the username is always correct if a user changes their name after messages
        have already been sent.

        Args:
            chat_id (str): Id of the chat to send to.
            sender_id (str): Hex id of the chat which the stream will contain.
            sender_username (str): Username of the user.
            message (str): Message to send. 

        Returns:
            str: Id of the message just sent.
        """
        stream_mssg = {
            "sender_id": sender_id,
            "content": message,
            "timestamp": datetime.now().isoformat()
        }
        message_id = await self._streams_redis.xadd(chat_id, stream_mssg)

        pubsub_mssg = {
            "type": "message",
            "message_id": message_id,
            "sender_id": sender_id,
            "sender_username": sender_username,
            "content": message,
            "timestamp": stream_mssg["timestamp"]
        }
        message_json = json.dumps(pubsub_mssg)
        await self._streams_redis.publish(chat_id, message_json)

        return message_id

    async def send_added_to_chat_notification(self, user_id: str, chat_preview: ChatPreview,
                                              added_by_id: str):
        """ Sends notification to user that they've been added to a chat.

        Args:
            user_id (str): Id hex string of user to notify
            chat_preview (ChatPreview): Details of chat user was added to
            added_by_id (str): The other user that added user_id to chat
        """
        pubsub_mssg = {
            "type": "added_to_chat",
            "added_by_id": added_by_id,
        }

        # Only include chat_preview if user isn't the one who created it
        if user_id != added_by_id:
            pubsub_mssg["chat_preview"] = chat_preview.model_dump()

        message_json = json.dumps(pubsub_mssg)
        await self._streams_redis.publish(user_id, message_json)

    async def send_removed_from_chat_notification(self, user_id: str, chat_id: str,
                                                  removed_by_id: str):
        """ Sends notification to user that they've been removed from a chat.

        Args:
            user_id (str): Id hex string of user to notify
            chat_id (str): Chat to remove from
            removed_by_id (str): The other user that removed user_id from chat
        """
        pubsub_mssg = {
            "type": "removed_from_chat",
            "chat_id": chat_id,
            "removed_by_id": removed_by_id,
        }
        message_json = json.dumps(pubsub_mssg)
        await self._streams_redis.publish(user_id, message_json)

    async def get_chat_history(
        self,
        chat_id: str,
        start_id: Optional[str] = None,
        end_id: Optional[str] = None,
        count: int = 15,
    ) -> list[ChatMessage]:
        """ Gets history of chat.

        Args:
            chat_id (str): The id of the chat stream
            start_id (Optional[str]): Starting message ID (inclusive). Defaults to earliest.
            end_id (Optional[str]): Ending message ID (inclusive). Defaults to latest. 
            count (int): Amount of messages to retrieve. Defaults to 15.
        """

        min_range = start_id if start_id is not None else "-"
        max_range = end_id if end_id is not None else "+"

        messages = await self._streams_redis.xrevrange(chat_id, max_range, min_range, count)

        formatted_messages = []
        for msg_id, fields in messages:
            (user_id, content, timestamp) = fields.values()

            formatted_messages.append(ChatMessage(
                message_id=msg_id,
                sender_id=user_id,
                sender_username=None,
                content=content,
                timestamp=timestamp),
            )

        return formatted_messages

    async def get_last_message(self, chat_id: str) -> Optional[ChatMessage]:
        """ Fetches the very last message from the chat

        Args:
            chat_id (str): The id of the chat

        Returns:
            ChatMessage: The last message of the chat
        """
        message = await self._streams_redis.xrevrange(chat_id, count=1)
        if message == []:
            return None
        (msg_id, fields) = message[0]
        (user_id, content, timestamp) = fields.values()

        formatted_message = ChatMessage(
            message_id=msg_id,
            sender_id=user_id,
            senderUsername=None,
            content=content,
            timestamp=timestamp
        )

        return formatted_message


redis_service = RedisService()
