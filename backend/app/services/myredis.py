""" Accesses redis for sessions / pubsub functionality"""
import os
import uuid
from dotenv import load_dotenv
import redis.asyncio as redis

load_dotenv()

redis_host = os.getenv("REDIS_HOST")
redis_port = int(os.getenv("REDIS_PORT"))
redis_db = int(os.getenv("REDIS_DB"))
redis_decode_on_warnings = os.getenv("REDIS_DECODE_RESPONSES").lower() == "true"
redis_ssl = os.getenv("REDIS_SSL").lower() == "true"
redis_certfile = os.path.join(os.getcwd(), "certs", "valkey.crt")

config = {
    "host": redis_host,
    "port": redis_port,
    "db": redis_db,
    "password": None,
    "decode_responses": redis_decode_on_warnings,
    "ssl": redis_ssl,
    "ssl_certfile": redis_certfile,
}

SESSION_TTL_SECONDS = 3600  # 1 hour

redis_client = redis.Redis(**config)

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

async def get_session(session_id: str) -> dict | None:
    """ Gets session, returns username if exists, None otherwise """
    session_key = f"session:{session_id}"
    session_data = await redis_client.hgetall(session_key)

    if not session_data:
        return None

    return session_data.get("username")
