source .venv/bin/activate
uvicorn app.main:app \
  --host localhost \
  --port 8000 \
  --ssl-keyfile certs/ChatApp-Server.key \
  --ssl-certfile certs/ChatApp-Server.crt \
  --reload