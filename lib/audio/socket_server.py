import os
import sys
import json
import time
import asyncio
import websockets

import http

import threading
import signal
from google.cloud import storage
import speech_recognition as sr
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from audio.conversation_handler import ConversationHandler

import fcntl
import errno

# Globals
conversation_handler = None
active_connections = {}
server = None
server_thread = None
LOCK_FILE = '/tmp/socket_server.lock'

def acquire_lock():
    try:
        fd = open(LOCK_FILE, 'w')
        fcntl.lockf(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        return fd
    except IOError as e:
        if e.errno == errno.EAGAIN:
            return None
        raise

def initialize_conversation_handler():
    global conversation_handler
    try:
        conversation_handler = ConversationHandler()
        print("Conversation handler initialized")
        return True
    except Exception as e:
        print(f"Error initializing conversation handler: {str(e)}")
        return False

async def handle_client(websocket):
    """Handle a client WebSocket connection"""
    connection_id = None
    try:
        # Register connection
        connection_id = id(websocket)
        active_connections[connection_id] = {
            "websocket": websocket,
            "user_id": None,
            "last_activity": time.time()
        }

        print(f"New connection established: {connection_id}")

        async for message in websocket:
            # Parse the message
            try:
                data = json.loads(message)
                message_type = data.get("type")

                # Update last activity time
                active_connections[connection_id]["last_activity"] = time.time()

                if message_type == "start_conversation":
                    # Initialize conversation for a user
                    user_id = data.get("user_id")
                    if not user_id:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": "Missing user_id parameter"
                        }))
                        continue

                    print(f"Starting conversation for user: {user_id}")
                    active_connections[connection_id]["user_id"] = user_id

                    # Load user profile
                    profile = conversation_handler.get_user_profile(user_id)

                    await websocket.send(json.dumps({
                        "type": "conversation_started",
                        "message": f"Profile loaded for {profile.get('name', user_id)}"
                    }))

                elif message_type == "user_message":
                    # Process a text message from the user
                    user_id = active_connections[connection_id]["user_id"]
                    if not user_id:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": "User not identified, send start_conversation first"
                        }))
                        continue

                    user_text = data.get("text", "")
                    print(f"Received message from {user_id}: {user_text}")

                    # Process the user input and get response
                    response = conversation_handler.handle_conversation_turn(user_id, user_text)

                    # Send text response
                    await websocket.send(json.dumps({
                        "type": "assistant_text",
                        "text": response["text"]
                    }))

                    # Send audio response if available
                    if response.get("audio"):
                        await websocket.send(json.dumps({
                            "type": "assistant_audio_ready",
                            "message": "Audio ready to stream"
                        }))

                        # Send binary audio data
                        await websocket.send(response["audio"])

            except json.JSONDecodeError:
                print(f"Received invalid JSON message")
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON message"
                }))

    except websockets.exceptions.ConnectionClosed:
        print(f"Connection closed")
    except Exception as e:
        print(f"Error handling client: {str(e)}")
    finally:
        # Clean up connection
        if connection_id and connection_id in active_connections:
            del active_connections[connection_id]
        print(f"Connection closed: {connection_id}")

async def start_websocket_server():
    """Start the WebSocket server"""
    global server
    try:
        host = "0.0.0.0"
        port = int(os.environ.get("PORT", 8080))

        # Initialize the conversation handler first
        if not initialize_conversation_handler():
            print("Failed to initialize conversation handler, cannot start server")
            return False

        async def process_request(path, headers):
            upgrade_header = headers.get('Upgrade', '')
            if not upgrade_header or 'websocket' not in upgrade_header.lower():
                return http.HTTPStatus.UPGRADE_REQUIRED, [], b'WebSocket upgrade required'

            return None, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Credentials': 'true',
            }

        server = await websockets.serve(
            handle_client,
            host,
            port,
            ping_interval=30,
            ping_timeout=10,
            compression=None,
            process_request=process_request
        )

        print(f"WebSocket server started on {host}:{port}")
        await server.wait_closed()
        return True

    except Exception as e:
        print(f"Error starting WebSocket server: {str(e)}")
        return False

def run_server():
    """Run the WebSocket server in a separate thread"""
    asyncio.run(start_websocket_server())

def start_server():
    """Start the WebSocket server in a separate thread"""
    global server_thread

    # Try to acquire lock
    lock_fd = acquire_lock()
    if not lock_fd:
        print("Server is already running (lock exists)")
        return {"status": "running", "message": "Server is already running"}

    if server_thread and server_thread.is_alive():
        print("Server thread is already running")
        return {"status": "running", "message": "Server is already running"}

    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()

    time.sleep(1)

    if server_thread.is_alive():
        print(f"Socket server is running with PID: {os.getpid()}")
        return {"status": "running", "message": "Socket server started", "pid": os.getpid()}
    else:
        return {"status": "error", "message": "Failed to start socket server"}

def stop_server():
    """Stop the WebSocket server"""
    global server, server_thread
    if server:
        try:
            server.close()
            if server_thread:
                server_thread.join(timeout=5)
            return {"status": "stopped", "message": "Server stopped"}
        except Exception as e:
            return {"status": "error", "message": f"Error stopping server: {str(e)}"}
    else:
        return {"status": "not_running", "message": "Server is not running"}

def signal_handler(sig, frame):
    print("Shutting down server...")
    stop_server()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "start":
            result = start_server()
            print(json.dumps(result))
        elif command == "stop":
            result = stop_server()
            print(json.dumps(result))
        else:
            print(f"Unknown command: {command}")
    else:
        result = start_server()
        print(json.dumps(result))
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            stop_server()