const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');

// Determine the environment
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Prepare for WebSocket server
const wsPort = parseInt(process.env.WS_PORT || '8080', 10);

app.prepare().then(() => {
  console.log(`Next.js app prepared - will listen on port ${port}`);

  // Create HTTP server for Next.js
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Start Next.js server
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Next.js server ready on http://${hostname}:${port}`);
  });

  // Create a separate HTTP server for WebSocket
  const wsServer = createServer();
  
  // Create WebSocket server using the HTTP server - NOTE: No path specified
  const wss = new WebSocket.Server({ server: wsServer });
  
  // Log WebSocket server details
  console.log('WebSocket server configuration:');
  console.log('- Server:', wsServer ? 'Created' : 'Failed');
  console.log('- WebSocket Server:', wss ? 'Created' : 'Failed');
  console.log('- Port:', wsPort);
  console.log('- Hostname:', hostname);
  
  // Add HTTP endpoints to WebSocket server for status checks
  wsServer.on('request', (req, res) => {
    const parsedUrl = parse(req.url, true);
    
    // Status endpoint
    if (parsedUrl.pathname === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'running',
        connections: wss.clients.size,
        timestamp: Date.now()
      }));
      return;
    }
    
    // Default response for other paths
    res.writeHead(404);
    res.end('Not Found');
  });

  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected from:', req.socket.remoteAddress);
    console.log('Path:', req.url);
    
    ws.on('message', (message) => {
      try {
        console.log('Raw message received:', message.toString());
        const data = JSON.parse(message.toString());
        console.log('Parsed message:', data);
        
        // Handle authentication message
        if (data.type === 'auth') {
          console.log(`Authenticated user: ${data.user_id}`);
          ws.userId = data.user_id;
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'Authentication successful',
            timestamp: Date.now()
          }));
        }
        
        // Handle user messages
        if (data.type === 'user_message') {
          // Echo the message back for testing
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'ai_message',
              message: `Echo: ${data.message}`,
              timestamp: Date.now()
            }));
          }, 1000);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'system',
      message: 'Connected to WebSocket server',
      timestamp: Date.now()
    }));
  });
  
  // Start WebSocket server
  wsServer.listen(wsPort, hostname, () => {
    console.log(`> WebSocket server ready on ws://${hostname}:${wsPort}`);
  });
});
