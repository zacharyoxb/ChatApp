""" Connects to AWS database """
import os
from dotenv import load_dotenv

from mysql.connector.aio import MySQLConnectionPool

load_dotenv()

db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASS')
db_host = os.getenv('DB_HOST')
db_port = int(os.getenv('DB_PORT'))
db_name = os.getenv('DB_NAME')
db_raise_on_warnings = os.getenv('DB_RAISE_ON_WARNINGS').lower() == "true"

config = {
  'user': db_user,
  'password': db_pass,
  'host': db_host,
  'port': db_port,
  'database': db_name,
  'raise_on_warnings': db_raise_on_warnings
}

# create connection pool, more thread safe
cnx_pool = MySQLConnectionPool(
    pool_name="aws_db_pool",
    pool_size=5,
    pool_reset_session=True,
    **config
)

ADD_USER_QUERY = "INSERT INTO users (user_id, user_name, pass_hash) VALUES (%s, %s, %s)"
GET_PASS_HASH_QUERY = "SELECT pass_hash FROM users WHERE user_name = ?"

async def init_db_pool() -> None:
    """ Initialises pool (call on startup) """
    await cnx_pool.initialize_pool()

async def add_user(user_id: bytes, user_name: str, pass_hash: str) -> None:
    """ Adds user to db """
    async with await cnx_pool.get_connection() as conn:
        cursor = await conn.cursor(prepared=True)
        await cursor.execute(ADD_USER_QUERY, (user_id, user_name, pass_hash))
        await conn.commit()
        await cursor.close()

async def get_password(username: str) -> str | None:
    """ Gets the password hash for a user. Returns None if user doesn't exist. """
    async with await cnx_pool.get_connection() as conn:
        cursor = await conn.cursor(prepared=True)
        await cursor.execute(GET_PASS_HASH_QUERY, (username,))
        result = await cursor.fetchone()
        await cursor.close()
        return result[0] if result else None

def add_group():
    """ Adds group to db """

def add_user_to_group():
    """ Adds user to group in db """
