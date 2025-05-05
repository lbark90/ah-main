#!/usr/bin/env node

const WebSocket = require('ws');
const http = require('http');

// Function to check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.on('error', () => {
      resolve(false);
    });
    server.on('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Function to test WebSocket connection
async function testWebSocketConnection(url) {
  return new Promise((resolve) => {
    console.log(`Testing connection to: ${url}`);
    
    const ws = new WebSocket(url);
    let timeoutId;
    
    ws.on('open', () => {
      console.log('Connection established successfully');
      clearTimeout(timeoutId);
      ws.close();
      resolve(true);
    });
    
    ws.on('error', (error) => {
      console.error('Connection error:', error.message);
      resolve(false);
    });
    
    timeoutId = setTimeout(() => {
      console.log('Connection timed out');
      ws.terminate();
      resolve(false);
    }, 5000);
  });
}

async function diagnose() {
  console.log('WebSocket Connection Diagnostics');
  console.log('===============================');
  
  // Check port 8080
  console.log('\nChecking if port 8080 is available...');
  const port8080Free = await checkPort(8080);
  console.log(`Port 8080 is ${port8080Free ? 'available' : 'in use'}`);
  
  if (!port8080Free) {
    console.log('- Port 8080 is in use, which could mean a WebSocket server is running');
    console.log('- Or another application might be using this port');
  }
  
  // Test connections
  console.log('\nTesting WebSocket connections:');
  
  const urls = [
    'ws://localhost:8080',
    'ws://localhost:8080/ws',
    'ws://127.0.0.1:8080',
    'ws://127.0.0.1:8080/ws'
  ];
  
  for (const url of urls) {
    const success = await testWebSocketConnection(url);
    console.log(`${url}: ${success ? '✅ Connected' : '❌ Failed'}`);
  }
  
  console.log('\nRecommendations:');
  
  if (port8080Free) {
    console.log('1. No WebSocket server appears to be running on port 8080');
    console.log('2. Start the WebSocket server using: node scripts/standalone-ws-server.js');
  } else if (!(await testWebSocketConnection('ws://localhost:8080'))) {
    console.log('1. Something is using port 8080 but it\'s not accepting WebSocket connections');
    console.log('2. Try stopping any services on port 8080 with: lsof -i :8080 | grep LISTEN');
    console.log('   Then: kill -9 <PID>');
    console.log('3. Start the WebSocket server using: node scripts/standalone-ws-server.js');
  } else {
    console.log('1. WebSocket server appears to be running and accepting connections');
    console.log('2. When connecting from your application, use: ws://localhost:8080 (no path)');
    console.log('3. Ensure your client code is properly handling the connection');
  }
}

diagnose();
