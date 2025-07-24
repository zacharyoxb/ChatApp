""" Logging to log db errors """
import logging

from connection import connect_to_mysql

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
    "CREATE TABLE 'users' ("
    " 'user_id' BINARY(16),"
    " 'user_name varchar(18) NOT NULL"
    " PRIMARY KEY ('user_id')"
    ") ENGINE=InnoDB"
)

TABLES['groups'] = (
    "CREATE TABLE 'groups' ("
    " 'group_id' BINARY(16),"
    " 'group_name varchar(30) NOT NULL"
    " PRIMARY KEY ('group_id')"
    ") ENGINE=InnoDB"
)

TABLES['users_in_groups'] = (
    "CREATE TABLE 'users_in_groups' ("
    " 'user_id' BINARY(16)"
    " 'group_id' BINARY(16),"
    " 'is_admin' BOOLEAN NOT NULL"
    " PRIMARY KEY ('user_id', 'group_id')"
    " FOREIGN KEY ('user_id') REFERENCES 'users' ('user_id')"
    " FOREIGN KEY ('group_id') REFERENCES 'groups' ('group_id')"
    ") ENGINE=InnoDB"
)

# connects to server, initialises db if doesn't exist
cnx = connect_to_mysql(config, logger, 10)


if cnx and cnx.is_connected():
    with cnx.cursor() as cursor:
        pass

    cnx.close()

else:
    print("Could not connect")
    