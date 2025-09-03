""" Accesses redis for sessions / pubsub functionality"""
from typing import Optional
import uuid

from redis import Redis
import redis.asyncio as redis

redis_client: Optional[Redis] = None

SESSION_TTL_SECONDS = 3600  # 1 hour

def init_redis(redis_config: dict) -> None:
    """ Initialises redis / valkey"""
    global redis_client
    redis_client = redis.Redis(**redis_config)

async def create_session(username: str) -> str:
    """ Creates session cookie """
    session_id = str(uuid.uuid4())
    try:
        await redis_client.hset(f"session:{session_id}",
            mapping={"username": username})
        await redis_client.expire(f"session:{session_id}", SESSION_TTL_SECONDS)
    except Exception as e:
        raise e

    return session_id

async def get_session(session_id: str) -> Optional[dict]:
    """ Gets session, returns username if exists, None otherwise """
    session_key = f"session:{session_id}"
    session_data = await redis_client.hgetall(session_key)

    if not session_data:
        return None

    return session_data.get("username")
