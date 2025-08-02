""" Connects to AWS database """
import os
import time
from dotenv import load_dotenv

import mysql.connector
from mysql.connector import Error

load_dotenv()

db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASS')
db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
db_name = os.getenv('DB_NAME')

config = {
  'user': db_user,
  'password': db_pass,
  'host': db_host,
  'port': db_port,
  'database': db_name,
  'raise_on_warnings': True
}


def get_connection(attempts=5, delay=2):
    """ Gets a connection to database."""
    attempt=1
    while attempt <= attempts:
        try:
            return mysql.connector.connect(**config)

        except (mysql.connector.Error, IOError) as _err:
            if attempt is not attempts:
                time.sleep(delay ** attempt)
                attempt+=1
    return None

def signup(username: str, password: str):
    """ Sends signup data to db """
