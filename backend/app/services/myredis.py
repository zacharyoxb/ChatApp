""" Accesses redis for sessions / pubsub functionality """
import time
from typing import Optional
import uuid

from redis import Redis
import redis.asyncio as redis

SESSION_TTL_SECONDS = 30 * 24 * 3600 # 30 days

class RedisService:
    """ Singleton instance holding redis connection """
    _instance: Optional['RedisService'] = None
    _redis_conn: Optional[Redis] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def init_redis(self, redis_config: dict) -> None:
        """ Initialises redis / valkey """
        self._redis_conn = redis.Redis(**redis_config)

    async def create_session(self, username: str) -> str:
        """ Creates session cookie """
        session_id = str(uuid.uuid4())
        await self._redis_conn.hset(f"session:{session_id}",
            mapping={
                "username": username, 
                "created_at": time.time(), 
                "last_activity": time.time()
            }
        )
        await self._redis_conn.expire(f"session:{session_id}", SESSION_TTL_SECONDS)

        return session_id

    async def get_session(self, session_id: str) -> Optional[dict]:
        """ Gets session, extends TTL due to activity """
        session_key = f"session:{session_id}"
        session_data = await self._redis_conn.hgetall(session_key)

        if not session_data:
            return None

        return session_data.get("username")

    async def extend_session(self, session_id: str) -> None:
        """ Extend session for sliding TTL """
        if not session_id:
            return

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
        """ Deletes session if exists """
        session_key = f"session:{session_id}"
        await self._redis_conn.delete(session_key)

redis_service = RedisService()
