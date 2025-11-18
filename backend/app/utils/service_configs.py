""" Fetches service configurations from the .env file. """
import os
from typing import Any, Dict, Optional
from dotenv import load_dotenv

load_dotenv()


class ConfigManager:
    """ Singleton configuration manager """
    _instance: Optional['ConfigManager'] = None
    _db_config: Optional[Dict[str, Any]] = None
    _sessions_redis_config: Optional[Dict[str, Any]] = None
    _streams_redis_config: Optional[Dict[str, Any]] = None
    _initialized: bool = False

    # List of required environment variables
    REQUIRED_DB_VARS = ["DB_USER", "DB_PASS", "DB_HOST", "DB_NAME"]
    REQUIRED_REDIS_VARS = [
        "SESSIONS_REDIS_HOST",
        "STREAMS_REDIS_HOST",

        "SESSIONS_REDIS_PORT",
        "STREAMS_REDIS_PORT",

        "SESSIONS_REDIS_DB",
        "STREAMS_REDIS_DB",

        "SESSIONS_REDIS_SSL",
        "STREAMS_REDIS_SSL",
    ]

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def initialize(self) -> None:
        """ Initialize and validate all configurations """
        if self._initialized:
            return

        # Validate and load DB config
        self._validate_env_vars(self.REQUIRED_DB_VARS, "Database")
        self._db_config = {
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASS'),
            'host': os.getenv('DB_HOST'),
            'port': int(os.getenv('DB_PORT', "3306")),
            'database': os.getenv('DB_NAME'),
            'raise_on_warnings': os.getenv('DB_RAISE_ON_WARNINGS', "True").lower() == "true",
            'ssl_disabled': os.getenv('DB_SSL_DISABLED', "False").lower() == "true"
        }

        # Validate and load Redis sessions config
        self._validate_env_vars(self.REQUIRED_REDIS_VARS, "Redis sessions")
        self._sessions_redis_config = {
            'host': os.getenv('SESSIONS_REDIS_HOST'),
            'port': int(os.getenv('SESSIONS_REDIS_PORT')),
            'db': int(os.getenv('SESSIONS_REDIS_DB', "0")),
            'decode_responses': True,
            'ssl': os.getenv('SESSIONS_REDIS_SSL', "False").lower() == "true"
        }

        # Validate and load Redis streams config
        self._validate_env_vars(self.REQUIRED_REDIS_VARS, "Redis sessions")
        self._streams_redis_config = {
            'host': os.getenv('STREAMS_REDIS_HOST'),
            'port': int(os.getenv('STREAMS_REDIS_PORT')),
            'db': int(os.getenv('STREAMS_REDIS_DB', "0")),
            'decode_responses': True,
            'ssl': os.getenv('STREAMS_REDIS_SSL', "False").lower() == "true"
        }

        self._initialized = True

    def _validate_env_vars(self, required_vars: list[str], service_name: str) -> None:
        missing_vars = []
        for var in required_vars:
            value = os.getenv(var)
            if value is None or value == "":
                missing_vars.append(var)

        if missing_vars:
            raise EnvironmentError(
                f"Missing {service_name} environment variables: {', '.join(missing_vars)}"
            )

    def get_db_config(self) -> Dict[str, Any]:
        """ Get database configuration """
        if not self._initialized:
            self.initialize()
        return self._db_config.copy()

    def get_session_redis_config(self) -> Dict[str, Any]:
        """ Get Redis configuration """
        if not self._initialized:
            self.initialize()
        return self._sessions_redis_config.copy()

    def get_streams_redis_config(self) -> Dict[str, Any]:
        """ Get Redis streams config"""
        if not self._initialized:
            self.initialize()
        return self._streams_redis_config.copy()


config_manager = ConfigManager()
