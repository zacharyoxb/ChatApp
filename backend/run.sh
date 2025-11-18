#!/bin/bash

if [[ $EUID -ne 0 ]]; then
   echo "${RED}This script must be run as root or with sudo${NC}."
   exit 1
fi

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

# Check if docker-compose.yml exists
if [ ! -f docker-compose.yml ]; then
  echo -e "${RED}docker-compose.yml not found in current directory${NC}"
  exit 1
fi

# Start Valkey services using docker-compose
echo -e "${YELLOW}Starting Valkey services with Docker Compose...${NC}"

# Check if services are already running
if docker-compose ps --services --filter "status=running" | grep -q -E "(valkey-sessions|valkey-streams)"; then
  echo -e "${YELLOW}Valkey services already running, restarting...${NC}"
  docker-compose down
  check_success "Stopped existing Valkey services"
fi

# Start the services
docker-compose up -d
check_success "Valkey services started"

# Wait for Valkey services to be ready
echo -e "${YELLOW}Waiting for Valkey services to become responsive...${NC}"

# Check valkey-sessions
for i in {1..10}; do
  if docker-compose exec -T valkey-sessions redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}valkey-sessions is ready!${NC}"
    break
  fi
  sleep 1
  if [ $i -eq 10 ]; then
    echo -e "${RED}valkey-sessions failed to start within 10 seconds${NC}"
    exit 1
  fi
done

# Check valkey-streams
for i in {1..10}; do
  if docker-compose exec -T valkey-streams redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}valkey-streams is ready!${NC}"
    break
  fi
  sleep 1
  if [ $i -eq 10 ]; then
    echo -e "${RED}valkey-streams failed to start within 10 seconds${NC}"
    exit 1
  fi
done


echo -e "${GREEN}Starting application...${NC}"
uvicorn app.main:app \
  --host localhost \
  --port 8000 \
  --ssl-keyfile certs/ChatApp-Server.key \
  --ssl-certfile certs/ChatApp-Server.crt \
  --reload
