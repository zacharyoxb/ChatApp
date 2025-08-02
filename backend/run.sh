uvicorn app.main:app \
  --host localhost \
  --port 8000 \
  --ssl-keyfile certs/fastapi-server.key \
  --ssl-certfile certs/fastapi-server.crt \
  --reload