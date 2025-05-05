#!/bin/bash

echo "=========================================="
echo "Complete Next.js Application Restart Script"
echo "=========================================="

# Stop all node processes
echo "Stopping all Node.js processes..."
pkill -f node || echo "No Node.js processes to kill"

# Clear all caches
echo "Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache

# Fix dependency issues
echo "Fixing dependency issues..."
npm uninstall framer-motion
npm install framer-motion@10.16.4

# Verify package.json is correct
echo "Verifying package.json..."
if ! grep -q "\"framer-motion\": \"^10.16.4\"" package.json; then
  echo "Updating framer-motion version in package.json..."
  sed -i 's/"framer-motion": "[^"]*"/"framer-motion": "^10.16.4"/g' package.json
fi

# Reinstall dependencies if needed
echo "Checking for node_modules integrity..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
  echo "Reinstalling all dependencies..."
  rm -rf node_modules
  npm ci || npm install
else
  echo "Node modules appear to be intact"
fi

# Check network interfaces and port availability
echo "Checking network configuration..."
echo "Network interfaces:"
ip addr show | grep "inet " | awk '{print $2}'

echo "Ensuring port 3000 is available..."
fuser -k 3000/tcp 2>/dev/null || echo "Port 3000 is already available"

# Build the application
echo "Building the application..."
npm run build

# Start the application with explicit host settings
echo "Starting the application..."
NODE_ENV=development HOST=0.0.0.0 next dev -p 3000 --hostname 0.0.0.0
