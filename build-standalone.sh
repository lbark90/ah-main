#!/bin/bash

set -e  # Exit on error

echo "=== Starting standalone build process ==="

# Ensure no server is running on port 3000
echo "Checking for processes using port 3000..."
if lsof -ti:3000 >/dev/null; then
  echo "Found processes using port 3000, stopping them..."
  lsof -ti:3000 | xargs kill -9
  echo "Processes stopped."
else
  echo "No processes found using port 3000."
fi

# Clean up previous build artifacts
echo "Cleaning previous build..."
rm -rf .next || true
rm -rf .next-temp || true
rm -rf .next-standalone || true
rm -rf node_modules/.cache || true

# Ensure environment is set correctly
export NODE_ENV=production

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "$1" == "--fresh" ]; then
  echo "Installing dependencies..."
  npm ci
fi

# Build with detailed output
echo "Building Next.js application..."
npx next build

# Check if standalone output was created
if [ -d ".next/standalone" ]; then
  echo "✅ Standalone output created successfully!"
  
  # Copy standalone to root for easier access
  echo "Copying standalone server to project root..."
  cp -r .next/standalone/* ./
  
  echo "Build completed successfully!"
  echo "You can now start the server with: ./start-production-server.sh"
  chmod +x ./start-production-server.sh
else
  echo "❌ Failed to create standalone build!"
  echo "Checking .next directory contents:"
  ls -la .next
  
  echo "Checking next.config.js for standalone setting:"
  grep -n "output" next.config.js
  
  echo "Try running with NODE_ENV=production npx next build"
  exit 1
fi
