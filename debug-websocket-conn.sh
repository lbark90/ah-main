#!/bin/bash

echo "===== WEBSOCKET CONNECTION DEBUG TOOL ====="

echo -e "\n1. Checking if WebSocket server is running:"
ps aux | grep "[p]ython.*socket_server.py"

echo -e "\n2. Checking port 8080 (WebSocket server port):"
ss -tuln | grep :8080

echo -e "\n3. Testing socket message with correct format:"
echo "Sending test message to socket server..."

PYTHON_CODE=$(cat <<EOF
import websocket
import json
import time

def on_message(ws, message):
    print(f"Message received: {message}")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print(f"Connection closed: {close_status_code} - {close_msg}")

def on_open(ws):
    print("Connection opened, sending init message...")
    init_message = {
        "type": "init",
        "user_id": "larrytest",
        "profile_path": "larrytest/credentials/login_credentials.json"
    }
    ws.send(json.dumps(init_message))
    print("Message sent!")

# Connect to WebSocket server
ws = websocket.WebSocketApp("ws://localhost:8080/ws",
                          on_open=on_open,
                          on_message=on_message,
                          on_error=on_error,
                          on_close=on_close)

ws.run_forever(timeout=10)
time.sleep(2)
EOF
)

# Run the Python code
python3 -c "import sys; exec(sys.argv[1])" "$PYTHON_CODE"

echo -e "\n===== WEBSOCKET DEBUG COMPLETE ====="
