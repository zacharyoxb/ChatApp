""" Connects to mysql database """
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional

from mysql.connector.aio import MySQLConnectionPool

# INSERT queries
CREATE_USER_QUERY = "INSERT INTO users (user_id, user_name, pass_hash) VALUES (%s, %s, %s)"
CREATE_CHAT_QUERY = """
INSERT INTO chats (chat_id, chat_name, created_by, is_public)
VALUES (%s, %s, (SELECT user_id FROM users WHERE user_name = %s), %s)
"""
ADD_USER_TO_CHAT_QUERY = """
INSERT INTO users_in_chats (user_id, chat_id, role)
VALUES ((SELECT user_id FROM users WHERE user_name = %s), %s, %s)
"""

# SELECT queries
GET_USER_EXISTS_QUERY = """
SELECT EXISTS(
    SELECT 1 FROM users WHERE user_name = %s
) AS user_exists
"""
GET_USER_ID_QUERY = "SELECT user_id FROM users WHERE user_name = ?"
GET_PASS_HASH_QUERY = "SELECT pass_hash FROM users WHERE user_name = ?"
GET_USER_CHATS_QUERY = """
    SELECT 
        c.chat_id,
        c.chat_name,
        c.last_message_at,
        NULL as other_user_id
    FROM chats c
    INNER JOIN users_in_chats uic ON c.chat_id = uic.chat_id
    INNER JOIN users u ON uic.user_id = u.user_id
    WHERE u.user_name = ?

    UNION ALL

    SELECT 
        c.chat_id,
        other_user.user_name as chat_name,
        c.last_message_at,
        other_user.user_id as other_user_id
    FROM chats c
    INNER JOIN dm_chats dm ON c.chat_id = dm.chat_id
    INNER JOIN users requesting_user ON requesting_user.user_name = ?
    INNER JOIN users other_user ON (
        CASE 
            WHEN dm.user1_id = requesting_user.user_id THEN dm.user2_id
            ELSE dm.user1_id
        END
    ) = other_user.user_id
    WHERE requesting_user.user_id IN (dm.user1_id, dm.user2_id)
    ORDER BY last_message_at DESC;
"""


class Role(Enum):
    """ Enum for the 3 possible roles. """
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


@dataclass
class CreateChatRequest:
    """ Data class for creating a new chat.

    Attributes:
        chat_id (bytes): Generated chat id.
        chat_name (str): Name of the chat.
        username (str): Username of the chat creator.
        is_public (bool, optional): Indicates whether the chat is public. Defaults to False.
        other_users (List[str], optional): Usernames of all other users in the chat. 
            Defaults to empty list.
    """
    chat_id: bytes
    chat_name: str
    username: str
    is_public: bool = False
    other_users: List[str] = field(default_factory=list)


@dataclass
class UserChat:
    """ Represents a chat in a user's chat list.

    Attributes:
        chat_id (bytes): Id of the chat
        chat_name (str): Name of the chat
        last_message_at (datetime): Timestamp of the last message in the chat
        other_user_id (bytes): User id of other user. Only present if the chat is
            a direct message.
    """
    chat_id: bytes
    chat_name: str
    last_message_at: datetime
    other_user_id: Optional[bytes]


class DatabaseService:
    """ Singleton instance holding database pool. """
    _instance: Optional['DatabaseService'] = None
    _pool: Optional[MySQLConnectionPool] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def init_db_pool(self, db_config: dict) -> None:
        """ Initialises pool. (call on startup ONLY) 

        Args:
            db_config (dict): Database configuration provided by service_configs. 
        """
        self._pool = MySQLConnectionPool(
            pool_name="db_pool",
            pool_size=5,
            pool_reset_session=True,
            **db_config
        )
        await self._pool.initialize_pool()

    async def create_user(self, user_id: bytes, username: str, pass_hash: str) -> None:
        """ Adds user to db. 

        Args:
            user_id (bytes): Generated id of user.
            username (str): Username of user.
            pass_hash (str): Hashed password of user.
        """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(CREATE_USER_QUERY, (user_id, username, pass_hash))
            await conn.commit()
            await cursor.close()

    async def create_chat(self, req: CreateChatRequest) -> None:
        """ Adds chat to db. 

        Args:
            req (CreateChatRequest): Dataclass for creating chat.
        """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            # create chat
            await cursor.execute(CREATE_CHAT_QUERY, (req.chat_id, req.chat_name, req.username,
                                                     req.is_public))
            # add creator as owner
            await cursor.execute(ADD_USER_TO_CHAT_QUERY,
                                 (req.username, req.chat_id, 'owner'))
            # add other users if provided
            for other_user_username in req.other_users:
                await cursor.execute(ADD_USER_TO_CHAT_QUERY,
                                     (other_user_username, req.chat_id, 'member'))
            await conn.commit()
            await cursor.close()

    async def add_user_to_chat(self, username: str, chat_id: bytes, role: Role):
        """ Adds user to chat in db. 

        Args:
            user_id (str): Added user's id. 
            chat_id (bytes): Id of chat to add user to.
            role (Role): Role to assign to user.
        """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(ADD_USER_TO_CHAT_QUERY, (username, chat_id, role))
            await conn.commit()
            await cursor.close()

    async def get_user_exists(self, username: str) -> bool:
        """ Checks if a user exists in the database

        Args:
            username (str): Username to check

        Returns:
            bool: Indicates whether the user exists or not.
        """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(GET_USER_EXISTS_QUERY, (username,))
            result = await cursor.fetchone()
            await cursor.close()
            return bool(result[0])

    async def get_password(self, username: str) -> Optional[str]:
        """ Gets the password hash for a user.

        Args:
            username (str): Username of user.

        Returns:
            Optional[str]: If user exists, the password hash. Otherwise none.
        """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(GET_PASS_HASH_QUERY, (username,))
            result = await cursor.fetchone()
            await cursor.close()
            return result[0] if result else None

    async def get_all_user_chats(self, username: str) -> list[UserChat]:
        """ Gets all group chats the user is in, including both group chats and DMs.

        Args:
            username (str): Username of the user whose chats are retrieved.

        Returns:
            list[UserChat]: List containing chat information.
        """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(GET_USER_CHATS_QUERY, (username,)*2)
            results = await cursor.fetchall()
            await cursor.close()

            return [
                UserChat(
                    chat_id=row[0],
                    chat_name=row[1],
                    last_message_at=row[2],
                    other_user_id=row[3]
                )
                for row in results
            ] if results else []


db_service = DatabaseService()
