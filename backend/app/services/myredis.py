""" Accesses redis for sessions / pubsub functionality """
import time
from typing import Optional
import uuid

from pydantic import BaseModel
from redis import Redis
import redis.asyncio as redis

SESSION_TTL_SECONDS = 86400  # 24 hours


class SessionData(BaseModel):
    """ Data structure for session information.

    Attributes:
        username (str): Username for user.
        created_at (float): Unix timestamp for when user was created.
        last_activity (float): Unix timestamp for the user's most recent activity.
    """
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
        """ Initialises redis / valkey 

        Args:
            redis_config (dict): Redis configuration provided by service_configs.
        """
        self._redis_conn = redis.Redis(**redis_config)

    async def create_session(self, username: str) -> str:
        """ Creates a session and returns a session cookie. 

        Args:
            user_id (bytes): The id of the user.
            username (str): The username of the user.

        Returns:
            str: The session id of the session.
        """
        session_id = str(uuid.uuid4())
        session_data = SessionData(
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
            username=session_data["username"],
            created_at=float(session_data["created_at"]),
            last_activity=float(session_data["last_activity"])
        )

    async def extend_session(self, session_id: str) -> None:
        """ Extend session for sliding TTL 

        Args:
            session_id (str): The session id of the session.
        """
        session_key = f"session:{session_id}"

        exists = await self._redis_conn.exists(session_key)
        if exists:
            await self._redis_conn.hset(
                session_key,
                "last_activity",
                time.time()
            )
            await self._redis_conn.expire(session_key, SESSION_TTL_SECONDS)

    async def delete_session(self, session_id: str) -> None:
        """ Deletes session if exists

        Args:
            session_id (str): The session id of the session. 
        """
        session_key = f"session:{session_id}"
        await self._redis_conn.delete(session_key)


redis_service = RedisService()
