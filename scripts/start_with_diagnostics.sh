#!/bin/bash

# Check if websocket server is running separately
echo "Checking for existing WebSocket server..."
if pgrep -f "websocket_server.py" > /dev/null; then
  echo "WebSocket server is already running separately"
  WEBSOCKET_RUNNING=true
else
  echo "No separate WebSocket server detected"
  WEBSOCKET_RUNNING=false
fi

# Check if Node.js server is running
if pgrep -f "node server.js" > /dev/null; then
  echo "Node.js server is already running"
  NODE_RUNNING=true
else
  echo "No Node.js server detected"
  NODE_RUNNING=false
fi

# Check available ports
echo "Checking port availability..."
if nc -z localhost 3000 2>/dev/null; then
  echo "Warning: Port 3000 is already in use"
  PORT_3000_FREE=false
else
  echo "Port 3000 is available"
  PORT_3000_FREE=true
fi

if nc -z localhost 8080 2>/dev/null; then
  echo "Warning: Port 8080 is already in use"
  PORT_8080_FREE=false
else
  echo "Port 8080 is available"
  PORT_8080_FREE=true
fi

# Start the server based on diagnostics
if [ "$NODE_RUNNING" = false ]; then
  echo "Starting the Node.js server..."
  echo "============================"
  node server.js
else
  echo "Node.js server is already running"
  echo "To restart, first run: pkill -f 'node server.js'"
fi

echo "Server started with diagnostics"
echo "Check /socket-test route to test WebSocket connectivity"
