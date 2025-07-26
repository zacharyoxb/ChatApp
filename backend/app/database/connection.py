"""
Functions for editing and accessing databases
"""

import logging
import time
import mysql.connector
from mysql.connector import errorcode


def connect_to_mysql(config, logger: logging.Logger, attempts=3, delay=2):
    """ Attempts connection to mysql instance """
    attempt = 1
    while attempt < attempts + 1:
        try:
            return mysql.connector.connect(**config)
        except (mysql.connector.Error, IOError) as err:
            time.sleep(delay ** attempt)
            attempt += 1
            if attempt is not attempts:
                logger.info(
                    "Connection failed: %s. Retrying (%d/%d)...",
                    err,
                    attempt,
                    attempts-1,
                )

    logger.info("Failed to connect, exiting without a connection: %s", err)
    raise err

def connect_to_db(cnx: mysql.connector.MySQLConnection, logger: logging.Logger, db_name: str):
    """ Connects to a database """
    with cnx.cursor() as cursor:
        try:
            cursor.execute(f"USE {db_name}")
            cnx.database = db_name
            return
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_BAD_DB_ERROR:
                cursor.execute(f"CREATE DATABASE {db_name} DEFAULT CHARACTER SET 'utf8'")
            else:
                logger.info("Failed to connect to database, exiting without connection: %s", err)
                raise err
