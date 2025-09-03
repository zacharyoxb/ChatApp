""" Accesses redis for sessions / pubsub functionality"""
from typing import Optional
import uuid

from redis import Redis
import redis.asyncio as redis

SESSION_TTL_SECONDS = 3600  # 1 hour

class RedisService:
    """ Singleton instance holding redis connection """
    _instance: Optional['RedisService'] = None
    _redis_conn: Optional[Redis] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def init_redis(self, redis_config: dict) -> None:
        """ Initialises redis / valkey"""
        self._redis_conn = redis.Redis(**redis_config)

    async def create_session(self, username: str) -> str:
        """ Creates session cookie """
        session_id = str(uuid.uuid4())
        try:
            await self._redis_conn.hset(f"session:{session_id}",
                mapping={"username": username})
            await self._redis_conn.expire(f"session:{session_id}", SESSION_TTL_SECONDS)
        except Exception as e:
            raise e

        return session_id

    async def get_session(self, session_id: str) -> Optional[dict]:
        """ Gets session, returns username if exists, None otherwise """
        session_key = f"session:{session_id}"
        session_data = await self._redis_conn.hgetall(session_key)

        if not session_data:
            return None

        return session_data.get("username")

redis_service = RedisService()
