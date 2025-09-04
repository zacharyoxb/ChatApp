#!/bin/bash

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command success
check_success() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1${NC}"
  else
    echo -e "${RED}✗ $1${NC}"
    exit 1
  fi
}

# Check if venv exists
if [ ! -d .venv/bin ]; then
  echo -e "${YELLOW}venv not found, creating venv${NC}"
  python3 -m venv .venv
  check_success "Virtual environment created"
fi

# Enter venv
source .venv/bin/activate

# Hash file used to check if requirements.txt has changed
if [ ! -f .venv/requirements_hash ] || [ "$(md5sum requirements.txt | cut -d' ' -f1)" != "$(cat .venv/requirements_hash)" ]; then
  echo -e "${YELLOW}Installing/updating dependencies...${NC}"
  pip install -r requirements.txt
  md5sum requirements.txt | cut -d' ' -f1 > .venv/requirements_hash
  check_success "Dependencies installed"
else
  echo -e "${GREEN}Dependencies already up to date${NC}"
fi

# Makes sure docker Valkey instance is created [IF USING EXTERNAL MICROSERVICE, COMMENT THIS OUT]
if ! docker ps --filter "name=valkey" --format '{{.Names}}' | grep -q 'valkey'; then
  echo -e "${YELLOW}Valkey container not running. Starting Valkey...${NC}"
  
  # Remove if exists but stopped
  if docker ps -a --filter "name=valkey" --format '{{.Names}}' | grep -q 'valkey'; then
    docker rm valkey
  fi
  
  docker run -d --name valkey -p 6379:6379 valkey/valkey:8.1.3
  check_success "Valkey container started"
  
  # Wait for Valkey to be ready
  echo -e "${YELLOW}Waiting for Valkey to become responsive...${NC}"
  for i in {1..10}; do
    if docker exec valkey redis-cli ping 2>/dev/null | grep -q "PONG"; then
      echo -e "${GREEN}Valkey is ready!${NC}"
      break
    fi
    sleep 1
    if [ $i -eq 10 ]; then
      echo -e "${RED}Valkey failed to start within 10 seconds${NC}"
      exit 1
    fi
  done
else
  echo -e "${GREEN}Valkey container is already running${NC}"
fi

echo -e "${GREEN}Starting application...${NC}"
uvicorn app.main:app \
  --host localhost \
  --port 8000 \
  --ssl-keyfile certs/ChatApp-Server.key \
  --ssl-certfile certs/ChatApp-Server.crt \
  --reload