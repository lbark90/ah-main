#!/bin/bash

echo "==== AliveHere Server Port Fix & Start Script ===="

# Function to find and kill processes using port 3000
fix_port() {
    local port=$1
    echo "Checking for processes using port $port..."
    
    # Find PIDs of processes using port 3000
    pids=$(lsof -t -i:$port)
    
    if [ -z "$pids" ]; then
        echo "✓ No processes found using port $port"
        return 0
    else
        echo "! Found processes using port $port: $pids"
        echo "Attempting to terminate processes..."
        
        for pid in $pids; do
            echo "Killing process $pid..."
            kill -15 $pid 2>/dev/null
        done
        
        # Give processes a moment to terminate gracefully
        sleep 2
        
        # Check if processes are still running
        pids=$(lsof -t -i:$port)
        if [ -z "$pids" ]; then
            echo "✓ All processes successfully terminated"
            return 0
        else
            echo "! Some processes couldn't be terminated gracefully. Forcing..."
            for pid in $pids; do
                echo "Force killing process $pid..."
                kill -9 $pid 2>/dev/null
            done
            sleep 1
            
            # Final check
            pids=$(lsof -t -i:$port)
            if [ -z "$pids" ]; then
                echo "✓ All processes successfully force-terminated"
                return 0
            else
                echo "✗ Failed to free port $port. PIDs still running: $pids"
                return 1
            fi
        fi
    fi
}

# Parse command line options
PORT=3000
START_COMMAND="next start"
FORCE=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift
            ;;
        -f|--force)
            FORCE=true
            ;;
        --dev)
            START_COMMAND="next dev"
            ;;
        --help)
            echo "Usage: ./fix-port-and-start.sh [options]"
            echo ""
            echo "Options:"
            echo "  -p, --port PORT      Specify port to use (default: 3000)"
            echo "  -f, --force          Force kill processes without confirmation"
            echo "  --dev                Start in development mode (next dev)"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run './fix-port-and-start.sh --help' for usage"
            exit 1
            ;;
    esac
    shift
done

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
            echo "✗ Failed to find an available port. Please try again later or manually specify a port."
            exit 1
        fi
    fi
fi

# Clear Next.js cache to avoid stale data
echo "Clearing Next.js cache..."
rm -rf .next/cache

# Start the application
echo "Starting server on port $PORT..."
if [ "$START_COMMAND" = "next start" ]; then
    PORT=$PORT npm run start -- -p $PORT
else
    PORT=$PORT npm run dev -- -p $PORT
fi
