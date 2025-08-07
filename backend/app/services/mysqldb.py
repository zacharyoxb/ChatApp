""" Connects to AWS database """
import os
from dotenv import load_dotenv

# This is not an async sql library, change later?
import mysql.connector

load_dotenv()

db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASS')
db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
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
cnx_pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="aws_db_pool",
    pool_size=5,
    pool_reset_session=True,
    **config
)

def get_connection():
    """ Gets a connection to the db """
    try:
        return cnx_pool.get_connection()
    except mysql.connector.Error as _e:
        return None
