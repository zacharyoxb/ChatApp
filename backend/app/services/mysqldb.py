""" Connects to mysql database """
from typing import Optional

from mysql.connector.aio import MySQLConnectionPool

cnx_pool: Optional[MySQLConnectionPool] = None

ADD_USER_QUERY = "INSERT INTO users (user_id, user_name, pass_hash) VALUES (%s, %s, %s)"
GET_PASS_HASH_QUERY = "SELECT pass_hash FROM users WHERE user_name = ?"
ADD_CHAT_QUERY = "INSERT INTO chats (chat_id, chat_name) VALUES (%s, %s)"

GET_CHATS_QUERY = """
    SELECT c.chat_id, c.chat_name 
    FROM users u JOIN users_in_chats uc ON u.user_id = uc.user_id
    JOIN chats c ON uc.chat_id = c.chat_id
    WHERE u.user_name = ? """


async def init_db_pool(db_config: dict) -> None:
    """ Initialises pool (call on startup) """
    global cnx_pool
    cnx_pool = MySQLConnectionPool(
        pool_name="db_pool",
        pool_size=5,
        pool_reset_session=True,
        **db_config
    )
    await cnx_pool.initialize_pool()

async def add_user(user_id: bytes, username: str, pass_hash: str) -> None:
    """ Adds user to db """
    async with await cnx_pool.get_connection() as conn:
        cursor = await conn.cursor(prepared=True)
        await cursor.execute(ADD_USER_QUERY, (user_id, username, pass_hash))
        await conn.commit()
        await cursor.close()

async def get_password(username: str) -> Optional[str]:
    """ Gets the password hash for a user. Returns None if user doesn't exist. """
    async with await cnx_pool.get_connection() as conn:
        cursor = await conn.cursor(prepared=True)
        await cursor.execute(GET_PASS_HASH_QUERY, (username,))
        result = await cursor.fetchone()
        await cursor.close()
        return result[0] if result else None

async def create_chat(chat_id: bytes, chat_name: str) -> None:
    """ Adds chat to db """
    async with await cnx_pool.get_connection() as conn:
        cursor = await conn.cursor(prepared=True)
        await cursor.execute(ADD_CHAT_QUERY, (chat_id, chat_name))
        await conn.commit()
        await cursor.close()

async def add_user_to_chat():
    """ Adds user to chat in db """

async def get_all_chats(username: str) -> Optional[list[tuple[int, str]]]:
    """ Gets all chats the user is in """
    async with await cnx_pool.get_connection() as conn:
        cursor = await conn.cursor(prepared=True)
        await cursor.execute(GET_CHATS_QUERY, (username,))
        result = await cursor.fetchall()
        await cursor.close()
        return result if result else None
