""" Connects to mysql database """
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional

from mysql.connector.aio import MySQLConnectionPool

# INSERT queries
CREATE_USER_QUERY = "INSERT INTO users (user_id, user_name, pass_hash) VALUES (%s, %s, %s)"
CREATE_CHAT_QUERY = "INSERT INTO chats (chat_id, chat_name, created_by, is_public) " \
    "VALUES (%s, %s, %s, %s)"
ADD_USER_TO_CHAT_QUERY = "INSERT INTO users_in_chats (user_id, chat_id, role) VALUES (%s, %s, %s)"

# SELECT queries
GET_USER_ID_QUERY = "SELECT user_id FROM users WHERE user_name = ?"
GET_PASS_HASH_QUERY = "SELECT pass_hash FROM users WHERE user_name = ?"
GET_USER_CHATS_QUERY = """
    SELECT 
        c.chat_id,
        c.chat_name,
        c.last_message_at,
        'group' as chat_type
    FROM chats c
    INNER JOIN users_in_chats uic ON c.chat_id = uic.chat_id
    WHERE uic.user_id = ?

    UNION ALL

    SELECT 
        c.chat_id,
        u.user_name as chat_name,  -- Use the other user's name as chat name for DMs
        c.last_message_at,
        'dm' as chat_type
    FROM chats c
    INNER JOIN dm_chats dm ON c.chat_id = dm.chat_id
    INNER JOIN users u ON (
        CASE 
            WHEN dm.user1_id = ? THEN dm.user2_id
            ELSE dm.user1_id
        END
    ) = u.user_id
    WHERE dm.user1_id = ? OR dm.user2_id = ?
    ORDER BY last_message_at DESC;
"""


class Role(Enum):
    """ Enum for all possible roles """
    OWNER = "Owner"
    ADMIN = "Admin"
    MEMBER = "Member"


@dataclass
class CreateChatRequest:
    """ Data class for creating a new chat """
    chat_id: bytes
    chat_name: str
    user_id: bytes
    is_public: bool
    other_users: List[bytes]


class DatabaseService:
    """ Singleton instance holding pool """
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

    async def create_user(self, user_id: bytes, username: str, pass_hash: str) -> None:
        """ Adds user to db """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(CREATE_USER_QUERY, (user_id, username, pass_hash))
            await conn.commit()
            await cursor.close()

    async def create_chat(self, req: CreateChatRequest) -> None:
        """ Adds chat to db """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            # create chat
            await cursor.execute(CREATE_CHAT_QUERY, (req.chat_id, req.chat_name, req.user_id,
                                                     req.is_public))
            # add creator as owner
            await cursor.execute(ADD_USER_TO_CHAT_QUERY, (req.user_id, req.chat_id, 'owner'))
            # add other users if provided
            for other_user_id in req.other_users:
                await cursor.execute(ADD_USER_TO_CHAT_QUERY, (other_user_id, req.chat_id, 'member'))
            await conn.commit()
            await cursor.close()

    async def add_user_to_chat(self, user_id: str, chat_id: bytes, role: Role):
        """ Adds user to chat in db """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(ADD_USER_TO_CHAT_QUERY, (user_id, chat_id, role))
            await conn.commit()
            await cursor.close()

    async def get_user_id(self, username: str) -> bytes:
        """ Gets user id from username """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(GET_USER_ID_QUERY, (username,))
            result = await cursor.fetchone()
            await cursor.close()
            return result[0] if result else None

    async def get_password(self, username: str) -> Optional[str]:
        """ Gets the password hash for a user. Returns None if user doesn't exist. """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(GET_PASS_HASH_QUERY, (username,))
            result = await cursor.fetchone()
            await cursor.close()
            return result[0] if result else None

    async def get_all_user_chats(self, user_id: bytes) -> Optional[list[tuple]]:
        """ Gets all group chats the user is in """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(GET_USER_CHATS_QUERY, (user_id,)*4)
            result = await cursor.fetchall()
            await cursor.close()
            return result if result else None


db_service = DatabaseService()
