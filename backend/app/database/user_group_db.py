""" Logging to log db errors """
import logging

from connection import connect_to_mysql, connect_to_db

DB_NAME = "UserGroupRelations"

config = {
  """ Config for connection to UserGroupRelations db log"""
  'user': 'admin',
  'password': '',
  'host': 'localhost',
  'raise_on_warnings': True
}

TABLES = {}
""" Tables establishing relationship between Users and Groups """

TABLES['users'] = (
    "CREATE TABLE IF NOT EXISTS 'users' ("
    " 'user_id' BINARY(16),"
    " 'user_name varchar(18) NOT NULL"
    " PRIMARY KEY ('user_id')"
    ")"
)

TABLES['groups'] = (
    "CREATE TABLE IF NOT EXISTS 'groups' ("
    " 'group_id' BINARY(16),"
    " 'group_name varchar(30) NOT NULL"
    " PRIMARY KEY ('group_id')"
    ")"
)

TABLES['users_in_groups'] = (
    "CREATE TABLE IF NOT EXISTS 'users_in_groups' ("
    " 'user_id' BINARY(16)"
    " 'group_id' BINARY(16),"
    " 'is_admin' BOOLEAN NOT NULL"
    " PRIMARY KEY ('user_id', 'group_id')"
    " FOREIGN KEY ('user_id') REFERENCES 'users' ('user_id')"
    " FOREIGN KEY ('group_id') REFERENCES 'groups' ('group_id')"
    ")"
)

# Set up logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# Log to console
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger.addHandler(handler)

# Also log to a file
file_handler = logging.FileHandler("logs/user-group-relations-errors.log")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# connects to server, initialises db if doesn't exist
cnx = connect_to_mysql(config, logger, 10)

if cnx and cnx.is_connected():
    connect_to_db(cnx, DB_NAME)
    with cnx.cursor() as cursor:
        for _, table_desc in TABLES.items():
            cursor.execute(table_desc)
    