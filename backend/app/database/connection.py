"""
Functions for editing and accessing databases
"""

import logging
import sys
import time
import mysql.connector
from mysql.connector import errorcode


def connect_to_mysql(config, logger: logging.Logger, attempts=3, delay=2):
    """ Attempts connection to mysql instance """
    attempt = 1
    # Implement a reconnection routine
    while attempt < attempts + 1:
        try:
            return mysql.connector.connect(**config)
        except (mysql.connector.Error, IOError) as err:
            if attempts is attempt:
                # Attempts to reconnect failed; returning None
                logger.info("Failed to connect, exiting without a connection: %s", err)
                return None
            logger.info(
                "Connection failed: %s. Retrying (%d/%d)...",
                err,
                attempt,
                attempts-1,
            )
            # progressive reconnect delay
            time.sleep(delay ** attempt)
            attempt += 1
    return None

def connect_to_db(cnx: mysql.connector.MySQLConnection, db_name):
    """ Connects to a database """
    with cnx.cursor() as cursor:
        try:
            cursor.execute(f"USE {db_name}")
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_BAD_DB_ERROR:
                cursor.execute(f"CREATE DATABASE {db_name} DEFAULT CHARACTER SET 'utf8")
            else:
                sys.exit(1)
        cnx.database = db_name
