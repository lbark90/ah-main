#!/bin/bash

echo "Starting production server..."

PORT=3001

# Check for processes using port $PORT
echo "Checking for processes using port $PORT..."
if sudo ss -tulpn | grep ":$PORT " >/dev/null; then
  echo "Port $PORT is already in use. Attempting to kill existing process..."
  
  # Try to kill the process
  sudo fuser -k $PORT/tcp
  sleep 2
  
  # Check if port is now free
  if sudo ss -tulpn | grep ":$PORT " >/dev/null; then
    echo "Failed to free port $PORT. Please investigate manually."
    exit 1
  fi
fi

echo "Starting server on port $PORT..."
PORT=$PORT node server.js || echo "Failed to start server. Check logs for details."
