""" Connects to mysql database """
from typing import Optional

from mysql.connector.aio import MySQLConnectionPool

ADD_USER_QUERY = "INSERT INTO users (user_id, user_name, pass_hash) VALUES (%s, %s, %s)"
GET_PASS_HASH_QUERY = "SELECT pass_hash FROM users WHERE user_name = ?"
ADD_CHAT_QUERY = "INSERT INTO chats (chat_id, chat_name) VALUES (%s, %s)"

GET_CHATS_QUERY = """
    SELECT c.chat_id, c.chat_name 
    FROM users u JOIN users_in_chats uc ON u.user_id = uc.user_id
    JOIN chats c ON uc.chat_id = c.chat_id
    WHERE u.user_name = ? """

class DatabaseService:
    """ Singleton instance holding pool"""
    _instance: Optional['DatabaseService'] = None
    _pool: Optional[MySQLConnectionPool] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def init_db_pool(self, db_config: dict) -> None:
        """ Initialises pool (call on startup ONLY) """
        self._pool = MySQLConnectionPool(
            pool_name="db_pool",
            pool_size=5,
            pool_reset_session=True,
            **db_config
        )
        await self._pool.initialize_pool()

    async def add_user(self, user_id: bytes, username: str, pass_hash: str) -> None:
        """ Adds user to db """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(ADD_USER_QUERY, (user_id, username, pass_hash))
            await conn.commit()
            await cursor.close()

    async def get_password(self, username: str) -> Optional[str]:
        """ Gets the password hash for a user. Returns None if user doesn't exist. """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(GET_PASS_HASH_QUERY, (username,))
            result = await cursor.fetchone()
            await cursor.close()
            return result[0] if result else None

    async def create_chat(self, chat_id: bytes, chat_name: str) -> None:
        """ Adds chat to db """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(ADD_CHAT_QUERY, (chat_id, chat_name))
            await conn.commit()
            await cursor.close()

    async def add_user_to_chat(self):
        """ Adds user to chat in db """

    async def get_all_chats(self, username: str) -> Optional[list[tuple[int, str]]]:
        """ Gets all chats the user is in """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(GET_CHATS_QUERY, (username,))
            result = await cursor.fetchall()
            await cursor.close()
            return result if result else None

db_service = DatabaseService()
