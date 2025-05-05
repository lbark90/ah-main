#!/bin/bash

echo "===== WEBSOCKET SERVER DEBUG TOOL ====="

echo -e "\n1. Checking if WebSocket server is running:"
ps aux | grep "[p]ython.*socket_server.py" || echo "WebSocket server is NOT running"

echo -e "\n2. Checking port 8080 (WebSocket server port):"
ss -tuln | grep :8080 || echo "No process is listening on port 8080"

echo -e "\n3. Testing WebSocket connection from command line:"
echo "Trying basic WebSocket connection..."
curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Host: localhost:8080" \
     --header "Origin: http://localhost:3000" \
     --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     --header "Sec-WebSocket-Version: 13" \
     http://localhost:8080/ws

echo -e "\n4. Starting WebSocket server if not running:"
if ! pgrep -f "python.*socket_server.py" > /dev/null; then
  echo "WebSocket server is not running. Starting it..."
  cd /opt/ah-main
  python lib/audio/socket_server.py > /tmp/socket_server.log 2>&1 &
  sleep 2
  if pgrep -f "python.*socket_server.py" > /dev/null; then
    echo "WebSocket server started successfully!"
  else
    echo "Failed to start WebSocket server. Check logs at /tmp/socket_server.log"
  fi
else
  echo "WebSocket server is already running."
fi

echo -e "\n===== WEBSOCKET DEBUG COMPLETE ====="
