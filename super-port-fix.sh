#!/bin/bash

echo "==== AliveHere Server SUPER Port Fix & Start Script ===="

# Function to find and kill processes using port with multiple detection methods
fix_port() {
    local port=$1
    echo "Checking for processes using port $port (method 1: lsof)..."
    
    # Method 1: Find PIDs using lsof
    pids=$(lsof -t -i:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "! Found processes using port $port: $pids"
        echo "Attempting to terminate processes..."
        
        for pid in $pids; do
            echo "Killing process $pid..."
            sudo kill -15 $pid 2>/dev/null
            sleep 1
            sudo kill -9 $pid 2>/dev/null
        done
    else
        echo "✓ No processes found using lsof"
    fi
    
    # Method 2: Check with ss/netstat
    echo "Checking for processes using port $port (method 2: ss/netstat)..."
    
    if command -v ss >/dev/null 2>&1; then
        processes=$(ss -lptn "sport = :$port" 2>/dev/null)
        if [ -n "$processes" ]; then
            echo "! Found processes with ss: $processes"
            pids=$(echo "$processes" | grep -o 'pid=[0-9]*' | cut -d= -f2)
            for pid in $pids; do
                echo "Killing process $pid..."
                sudo kill -9 $pid 2>/dev/null
            done
        else
            echo "✓ No processes found using ss"
        fi
    fi
    
    if command -v netstat >/dev/null 2>&1; then
        processes=$(netstat -tlpn 2>/dev/null | grep ":$port ")
        if [ -n "$processes" ]; then
            echo "! Found processes with netstat: $processes"
            pids=$(echo "$processes" | grep -o '[0-9]*/[^ ]*' | cut -d/ -f1)
            for pid in $pids; do
                if [ -n "$pid" ]; then
                    echo "Killing process $pid..."
                    sudo kill -9 $pid 2>/dev/null
                fi
            done
        else
            echo "✓ No processes found using netstat"
        fi
    fi
    
    # Method 3: Use fuser to find and kill
    echo "Checking for processes using port $port (method 3: fuser)..."
    if command -v fuser >/dev/null 2>&1; then
        sudo fuser -k -n tcp $port 2>/dev/null
        echo "✓ Attempted fuser kill on port $port"
    fi
    
    # Final verification
    sleep 2
    echo "Verifying port $port is free..."
    
    # Test bind to the port to ensure it's actually available
    (
        echo "Testing port availability with a temporary server..."
        python3 -c "
import socket
import time
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.bind(('0.0.0.0', $port))
    print('Port is available!')
    s.close()
    exit(0)
except Exception as e:
    print(f'Port is still in use: {e}')
    exit(1)
" 2>/dev/null
    )
    
    if [ $? -eq 0 ]; then
        echo "✓ Verified port $port is now available"
        return 0
    else
        echo "✗ Port $port is still in use after all attempts"
        return 1
    fi
}

# Parse command line options
PORT=3000
START_COMMAND="next start"
FORCE=false
USE_ALT_PORT=false
USE_STANDALONE=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift
            ;;
        -f|--force)
            FORCE=true
            ;;
        --alt-port)
            USE_ALT_PORT=true
            ;;
        --dev)
            START_COMMAND="next dev"
            ;;
        --standalone)
            USE_STANDALONE=true
            ;;
        --help)
            echo "Usage: ./super-port-fix.sh [options]"
            echo ""
            echo "Options:"
            echo "  -p, --port PORT      Specify port to use (default: 3000)"
            echo "  -f, --force          Force kill processes without confirmation"
            echo "  --alt-port           Use alternative port 3001 without checking 3000"
            echo "  --dev                Start in development mode (next dev)"
            echo "  --standalone         Use standalone server.js instead of next start"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run './super-port-fix.sh --help' for usage"
            exit 1
            ;;
    esac
    shift
done

# Use alternative port immediately if requested
if [ "$USE_ALT_PORT" = true ]; then
    PORT=3001
    echo "Using alternative port $PORT as requested"
fi

echo "Port to use: $PORT"
echo "Command to run: $START_COMMAND"

# Fix port issues
if fix_port $PORT; then
    echo "✓ Port $PORT is available"
else
    if [ "$FORCE" = false ]; then
        read -p "Port $PORT could not be freed. Start on a different port? [Y/n] " response
        case "$response" in
            [nN][oO]|[nN])
                echo "Exiting at user request."
                exit 1
                ;;
            *)
                PORT=$((PORT + 1))
                echo "Trying port $PORT instead..."
                if fix_port $PORT; then
                    echo "✓ Port $PORT is available"
                else
                    echo "✗ Failed to find an available port. Please try again later or manually specify a port."
                    exit 1
                fi
                ;;
        esac
    else
        PORT=$((PORT + 1))
        echo "Trying port $PORT instead..."
        if fix_port $PORT; then
            echo "✓ Port $PORT is available"
        else
            # Try one more port
            PORT=$((PORT + 1))
            echo "Trying port $PORT instead..."
            if fix_port $PORT; then
                echo "✓ Port $PORT is available"
            else
                echo "✗ Failed to find an available port. Please try again later or manually specify a port."
                exit 1
            fi
        fi
    fi
fi

# Clear Next.js cache to avoid stale data
echo "Clearing Next.js cache..."
rm -rf .next/cache

# Check if we should use standalone mode based on next.config.js
if [ "$USE_STANDALONE" = false ]; then
    # Auto-detect standalone configuration
    if grep -q '"output": *"standalone"' next.config.js 2>/dev/null || grep -q "output: *['\"]standalone['\"]" next.config.js 2>/dev/null; then
        echo "Detected 'output: standalone' in next.config.js - using standalone mode"
        USE_STANDALONE=true
    fi
fi

# Start the application with explicit host binding to avoid IPv6 issues
echo "Starting server on port $PORT..."
if [ "$USE_STANDALONE" = true ]; then
    echo "Using standalone server.js file..."
    if [ -f ".next/standalone/server.js" ]; then
        PORT=$PORT HOST=0.0.0.0 node .next/standalone/server.js
    else
        echo "❌ Standalone server.js not found. Please run 'npm run build' first."
        exit 1
    fi
elif [ "$START_COMMAND" = "next start" ]; then
    HOST=0.0.0.0 PORT=$PORT npm run start -- -p $PORT --hostname 0.0.0.0
else
    HOST=0.0.0.0 PORT=$PORT npm run dev -- -p $PORT --hostname 0.0.0.0
fi
