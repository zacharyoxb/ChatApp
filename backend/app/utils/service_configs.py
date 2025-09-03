""" Fetches service configurations from the .env file. """
import os
from dotenv import load_dotenv

load_dotenv()

# List of required environment variables
REQUIRED_ENV_VARS = [
    "DB_USER",
    "DB_PASS", 
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_RAISE_ON_WARNINGS",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_DB",
    "REDIS_DECODE_RESPONSES",
    "REDIS_SSL"
]

def get_service_configs() -> tuple[dict, dict]:
    """ Check all required environment variables are set and return the db and redis configs """
    missing_vars = []
    for var in REQUIRED_ENV_VARS:
        value = os.getenv(var)
        if value is None or value == "":
            missing_vars.append(var)

    if missing_vars:
        raise EnvironmentError(
            f"Missing or empty required environment variables: {', '.join(missing_vars)}. "
            "Please check your .venv file and make sure all variables are properly set."
        )

    db_config = {
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASS'),
        'host': os.getenv('DB_HOST'),
        'port': int(os.getenv('DB_PORT')),
        'database': os.getenv('DB_NAME'),
        'raise_on_warnings': os.getenv('DB_RAISE_ON_WARNINGS').lower() == "true"
    }

    redis_config = {
        'host': os.getenv('REDIS_HOST'),
        'port': int(os.getenv('REDIS_PORT')),
        'db': int(os.getenv('REDIS_DB')),
        'decode_responses': os.getenv('REDIS_DECODE_RESPONSES').lower() == "true",
        'ssl': os.getenv('REDIS_SSL').lower() == "true"
    }

    return db_config, redis_config
