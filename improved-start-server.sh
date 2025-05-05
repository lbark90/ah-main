#!/bin/bash

echo "Preparing to start Next.js server..."

echo "Checking for existing Node.js processes..."
ps aux | grep node | grep -v grep | awk '{print $2, "node"}'

echo "Stopping any existing processes on port 3000..."
fuser -k 3000/tcp 2>/dev/null || echo "No processes to kill on port 3000"

echo "Clearing Next.js cache..."
rm -rf .next/cache
rm -rf node_modules/.cache

echo "Checking network interfaces..."
ip addr show | grep "inet " | awk '{print $2}'

echo "Testing connection to localhost..."
nc -zv localhost 3000 2>/dev/null || echo "Port 3000 is not in use (good)"

echo "Rebuilding the application..."
NODE_ENV=development npm run build

echo "Starting server with improved settings..."
echo "Starting server on port 3000 with explicit host configuration..."
NODE_ENV=development HOST=0.0.0.0 next dev -p 3000 --hostname 0.0.0.0
