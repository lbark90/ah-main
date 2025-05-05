#!/bin/bash

echo "Starting AliveHere application properly..."

# Kill any existing processes on port 3000
echo "Checking for processes on port 3000..."
fuser -k 3000/tcp 2>/dev/null || echo "No processes to kill on port 3000"

# Clear cache
echo "Clearing Next.js cache..."
rm -rf .next/cache

# Use npm scripts instead of direct 'next' command
echo "Starting server using npm script..."
npm run dev

# If npm run dev fails, try with npx
if [ $? -ne 0 ]; then
  echo "npm run dev failed, trying with npx..."
  npx next dev -p 3000 -H 0.0.0.0
fi
