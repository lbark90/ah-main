#!/bin/bash

echo "Checking for existing Node.js processes..."
ps aux | grep node | grep -v grep | awk '{print $2, "node"}'

echo "Stopping any existing Next.js processes..."
nextjs_pids=$(ps aux | grep "next" | grep -v grep | awk '{print $2}')
if [ -z "$nextjs_pids" ]; then
  echo "No Next.js processes found"
else
  echo "Killing processes: $nextjs_pids"
  kill -9 $nextjs_pids
fi

echo "Clearing Next.js cache..."
rm -rf .next/cache

echo "Starting server with debug output..."
echo "Starting server on port 3000..."
npm run dev
