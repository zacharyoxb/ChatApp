""" Accesses redis for sessions / pubsub functionality"""
import os
import uuid
from dotenv import load_dotenv
import redis.asyncio as redis

load_dotenv()

redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redis_db = os.getenv("REDIS_DB")
redis_password = os.getenv("REDIS_PASSWORD")
redis_decode_on_warnings = os.getenv("REDIS_DECODE_RESPONSES").lower() == "true"

config = {
    "host": redis_host,
    "port": redis_port,
    "db": redis_db,
    "password": redis_password,
    "decode_responses": redis_decode_on_warnings,
}

SESSION_TTL_SECONDS = 3600  # 1 hour

redis_client = redis.Redis(**config)

async def create_session(username: str) -> str:
    """ Creates session cookie """
    session_id = str(uuid.uuid4())
    await redis_client.hset(f"session:{session_id}",
        mapping={"user": username, "status": "active"})
    await redis_client.expire(f"session:{session_id}", SESSION_TTL_SECONDS)
    return session_id

async def get_session(session_id: str, _username: str) -> dict | None:
    """ Gets session """
    session_key = f"session:{session_id}"
    session_data = await redis_client.hgetall(session_key)

    if not session_data:
        return None

    # check if username from session matches

    return session_data
