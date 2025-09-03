# check if venv exists
if [ ! -d .venv/bin ]; then
  echo "venv not found, creating venv"
  python3 -m venv .venv
fi

# enter venv, check libraries are installed
source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app \
  --host localhost \
  --port 8000 \
  --ssl-keyfile certs/ChatApp-Server.key \
  --ssl-certfile certs/ChatApp-Server.crt \
  --reload