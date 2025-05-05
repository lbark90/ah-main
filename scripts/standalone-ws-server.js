#!/usr/bin/env node

const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer((req, res) => {
  // Simple status endpoint
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'running',
      connections: wss.clients.size,
      timestamp: Date.now()
    }));
    return;
  }
  
  // Default response
  res.writeHead(404);
  res.end('Not Found');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Log connections
wss.on('connection', (ws, req) => {
  console.log(`Client connected from ${req.socket.remoteAddress}`);
  
  // Handle messages
  ws.on('message', (message) => {
    try {
      console.log('Received message:', message.toString());
      const data = JSON.parse(message.toString());
      
      if (data.type === 'auth') {
        console.log(`User authenticated: ${data.user_id}`);
        ws.send(JSON.stringify({
          type: 'auth_success',
          message: 'Authentication successful',
          timestamp: Date.now()
        }));
      }
      
      if (data.type === 'user_message') {
        console.log(`User message: ${data.message}`);
        // Echo back
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'ai_message',
            message: `Server received: ${data.message}`,
            timestamp: Date.now()
          }));
        }, 500);
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'system',
    message: 'Connected to standalone WebSocket server',
    timestamp: Date.now()
  }));
  
  // Handle close
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`WebSocket server running at ws://${HOST}:${PORT}`);
  console.log(`Status endpoint: http://${HOST}:${PORT}/status`);
});
