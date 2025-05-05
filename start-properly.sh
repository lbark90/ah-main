#!/bin/bash

echo "=== AliveHere Application Startup Script ==="
echo "Checking Node.js environment..."
node -v
npm -v

echo "Fixing framer-motion dependency..."
npm uninstall framer-motion
npm install framer-motion@"^10.16.4"

echo "Checking 'next' command availability..."
if ! command -v next &> /dev/null; then
    echo "'next' command not found in PATH, will use npm scripts instead"
    HAS_NEXT_COMMAND=false
else
    echo "'next' command is available"
    HAS_NEXT_COMMAND=true
fi

echo "Stopping any processes on port 3000..."
fuser -k 3000/tcp 2>/dev/null || echo "No processes to kill on port 3000"

echo "Clearing Next.js cache..."
rm -rf .next/cache

echo "Starting AliveHere application..."
if $HAS_NEXT_COMMAND; then
    # If 'next' is available directly
    next dev -p 3000 -H 0.0.0.0
else
    # Use npm scripts instead
    npm run dev
fi

# If npm run dev fails, try with npx
if [ $? -ne 0 ]; then
    echo "Standard start method failed, trying with npx..."
    npx next dev -p 3000 -H 0.0.0.0
fi
