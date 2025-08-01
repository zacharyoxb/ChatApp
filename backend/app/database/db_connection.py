""" Connects to AWS database """
import os
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

try:
    connection = mysql.connector.connect(**config)


except Error as e:
    print("Connection error:", e)

finally:
    if 'connection' in locals() and connection.is_connected():
        connection.close()
        print("Connection closed")
