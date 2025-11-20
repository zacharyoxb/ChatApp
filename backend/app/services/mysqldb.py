""" Connects to mysql database """
from typing import List, Optional

from mysql.connector.aio import MySQLConnectionPool

from app.templates.chats.requests import NewChatData
from app.templates.chats.responses import ChatPreview, UserRole

# INSERT queries
CREATE_USER_QUERY = "INSERT INTO users (user_id, user_name, pass_hash) VALUES (%s, %s, %s)"
CREATE_CHAT_QUERY = """
INSERT INTO chats (chat_id, chat_name, created_by, is_public)
VALUES (%s, %s, %s, %s)
"""
ADD_USER_TO_CHAT_QUERY = """
INSERT INTO users_in_chats (user_id, chat_id, role)
VALUES (%s, %s, %s)
"""

# SELECT queries
GET_USER_EXISTS_QUERY = """
SELECT EXISTS(
    SELECT 1 FROM users WHERE user_name = %s
) AS user_exists
"""
GET_USER_ID_QUERY = "SELECT user_id FROM users WHERE user_name = ?"
GET_USERNAME_QUERY = "SELECT user_name FROM users WHERE user_id = ?"
GET_PASS_HASH_QUERY = "SELECT pass_hash FROM users WHERE user_name = ?"
GET_USER_CHATS_QUERY = """
    SELECT 
        c.chat_id,
        c.chat_name,
        NULL as other_user_id,
        uic.role
    FROM chats c
    INNER JOIN users_in_chats uic ON c.chat_id = uic.chat_id
    INNER JOIN users u ON uic.user_id = u.user_id
    WHERE u.user_name = ?

    UNION ALL

    SELECT 
        c.chat_id,
        other_user.user_name as chat_name,
        other_user.user_id as other_user_id,
        NULL as role
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
"""


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

    async def create_chat(self, chat_creator_id: bytes, req: NewChatData) -> None:
        """ Adds chat to db. 

        Args:
            req (NewChatData): Model for creating chat.
        """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            # create chat
            await cursor.execute(CREATE_CHAT_QUERY, (req.chat_id, req.chat_name, chat_creator_id,
                                                     req.is_public))
            # add creator as owner
            await cursor.execute(ADD_USER_TO_CHAT_QUERY,
                                 (chat_creator_id, req.chat_id, 'owner'))
            # add other users if provided
            for other_user_username in req.other_users:
                await cursor.execute(ADD_USER_TO_CHAT_QUERY,
                                     (other_user_username, req.chat_id, 'member'))
            await conn.commit()
            await cursor.close()

    async def add_user_to_chat(self, username: str, chat_id: bytes, role: UserRole):
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

    async def get_user_id(self, username: str) -> Optional[bytes]:
        """ Gets the user id for a given username.

        Args:
            username (str): Username of user.
        Returns:
            Optional[bytes]: If user exists, the user id. Otherwise none.
        """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(GET_USER_ID_QUERY, (username,))
            result = await cursor.fetchone()
            await cursor.close()
            return result[0] if result else None

    async def get_username(self, user_id: bytes) -> Optional[str]:
        """ Gets the username for a given user id.

        Args:
            user_id (bytes): User id of user.

        Returns:
            Optional[str]: Username if user exists, else None.
        """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(GET_USERNAME_QUERY, (user_id,))
            result = await cursor.fetchone()
            await cursor.close()
            return result[0] if result else None

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

    async def get_all_user_chats(self, username: str) -> list[ChatPreview]:
        """ Gets all group chats the user is in, including both group chats and DMs.

        Args:
            username (str): Username of the user whose chats are retrieved.

        Returns:
            list[ChatPreview]: List containing chat information.
        """
        async with await self._pool.get_connection() as conn:
            cursor = await conn.cursor(prepared=True)
            await cursor.execute(GET_USER_CHATS_QUERY, (username,)*2)
            results = await cursor.fetchall()
            await cursor.close()

            return [
                ChatPreview(
                    chat_id=(chat_bytes_id := row[0]) and chat_bytes_id.hex(),
                    chat_name=row[1],
                    dm_participant_id=(bytes_id := row[2]) and bytes_id.hex(),
                    last_message=None,
                    my_role=row[3]
                )
                for row in results
            ] if results else []

    async def get_all_available_chats(self, username: str) -> List[ChatPreview]:
        """ Gets all chats that the user isn't in but are available for the user to join. 

        Args:
            username (str): Username of the user whose chats are retrieved.

        Returns:
            list[UserChat]: List containing chat information.
        """


db_service = DatabaseService()
