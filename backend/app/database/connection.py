"""
Functions for editing and accessing databases
"""

import logging
import time
import mysql.connector
from mysql.connector import errorcode

class Database:
    """ Database class for connecting to databases """
    def __init__(self, name: str, config: dict, logger: logging.Logger, schema: dict):
        self.name = name
        self.config = config
        self.logger = logger
        self.attempts = 3
        self.delay = 2
        self.connection: mysql.connector.MySQLConnection = None

        self._connect()
        self._init_database(schema)


    def _connect(self):
        """ Attempts to connect to the database and log errors if connection fails """
        attempt = 1
        while attempt <= self.attempts:
            try:
                self.connection = mysql.connector.connect(**self.config)
                self.logger.info("Successfully connected to the MySQL server.")
                return
            except (mysql.connector.Error, IOError) as err:
                self.logger.error("Connection failed on attempt %d: %s", attempt, err)
                time.sleep(self.delay ** attempt)
                attempt += 1
                if attempt <= self.attempts:
                    self.logger.info("Retrying connection... (%d/%d)", attempt, self.attempts)
                else:
                    self.logger.error("Failed to connect after %d attempts: %s", self.attempts, err)
                    raise err

    def _init_database(self, _schema: dict):
        """ Creates the database if it does not exist and inits tables """
        # create db if doesn't exist
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE {self.name} DEFAULT CHARACTER SET 'utf8'")
                self.logger.info(f"Database {self.name} created successfully.")
        except mysql.connector.Error as err:
            if err.errno != errorcode.ER_BAD_DB_ERROR:
                self.logger.error("Failed to init database and tables: %s", err)
                raise err

        # create tables if they don't exist


    def _close(self):
        """ Close the database connection """
        if self.connection:
            self.connection.close()
            self.logger.info("Connection closed.")
        else:
            self.logger.warning("No active connection to close.")
