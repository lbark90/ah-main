"use client";

import { useState, useEffect, useRef } from "react";

export default function SocketTest() {
  const [status, setStatus] = useState<string>("Checking WebSocket status...");
  const [connected, setConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // First check if the socket server is running via our API
    fetch('/api/socket/status')
      .then(res => res.json())
      .then(data => {
        setStatus(`WebSocket server: ${data.status} - ${data.message}`);

        if (data.status === 'running') {
          connectWebSocket();
        }
      })
      .catch(err => {
        setStatus(`Error checking WebSocket status: ${err.message}`);
      });

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = ':8080'; // Always use port 8080 for the WebSocket server

      // Connect directly to the WebSocket server without a path
      const socketUrl = `${protocol}//${host}${port}`;

      setStatus(`Attempting to connect to ${socketUrl}...`);

      // Close any existing connection
      if (socketRef.current) {
        socketRef.current.close();
      }

      const socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        setStatus("Connected to WebSocket server");
        setConnected(true);
        addMessage("System: Connected to WebSocket server");

        // Send auth message
        const authMessage = JSON.stringify({
          type: "auth",
          user_id: "test_user",
          timestamp: Date.now()
        });

        console.log("Sending auth message:", authMessage);
        socket.send(authMessage);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'auth_success') {
            addMessage("System: Authentication successful");
          } else if (data.type === 'ai_message') {
            addMessage(`AI: ${data.message}`);
          } else {
            addMessage(`Received: ${event.data}`);
          }
        } catch (e) {
          addMessage(`Received: ${event.data}`);
        }
      };

      socket.onerror = (event) => {
        setStatus("WebSocket error occurred");
        addMessage("Error: WebSocket connection error");
        setConnected(false);
      };

      socket.onclose = (event) => {
        setStatus(`WebSocket connection closed: ${event.code} ${event.reason}`);
        addMessage(`System: Connection closed (${event.code})`);
        setConnected(false);
      };

      socketRef.current = socket;
    } catch (err) {
      setStatus(`Failed to create WebSocket: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      addMessage("Error: WebSocket not connected");
      return;
    }

    if (!inputMessage.trim()) return;

    try {
      socketRef.current.send(JSON.stringify({
        type: "user_message",
        message: inputMessage,
        timestamp: Date.now()
      }));

      addMessage(`You: ${inputMessage}`);
      setInputMessage("");
    } catch (err) {
      addMessage(`Error sending message: ${err.message}`);
    }
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg max-w-xl mx-auto my-8">
      <h2 className="text-xl font-bold mb-4">WebSocket Test</h2>

      <div className={`p-2 mb-4 rounded ${status.includes('running') || status.includes('Connected')
        ? 'bg-green-900/30 text-green-400'
        : 'bg-red-900/30 text-red-400'
        }`}>
        {status}
      </div>

      <div className="border border-slate-700 rounded-lg p-4 mb-4 h-64 overflow-y-auto bg-slate-900/50">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            {msg}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!connected}
          placeholder="Type a message..."
          className="flex-1 p-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={!connected}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={connectWebSocket}
          disabled={connected}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reconnect
        </button>
      </div>
    </div>
  );
}
