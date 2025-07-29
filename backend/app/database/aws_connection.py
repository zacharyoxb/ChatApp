import os
from pathlib import Path
from dotenv import load_dotenv
import mysql.connector

current_dir = os.path.abspath(os.getcwd())
dotenv_path = Path(current_dir)
load_dotenv(dotenv_path=dotenv_path)

AWS_ENDPOINT=os.getenv('AWS_ENDPOINT')
AWS_PORT=os.getenv('AWS_PORT')
AWS_USERNAME=os.getenv('AWS_USERNAME')
AWS_PASSWORD=os.getenv('AWS_PASSWORD')
AWS_DATABASE=os.getenv('AWS_DATABASE')

cnx = mysql.connector.connect(user=AWS_USERNAME, password=AWS_PASSWORD,
                              host=AWS_ENDPOINT, database=AWS_DATABASE)

print("hi")
