#!/bin/bash

echo "Checking and fixing port access issues..."

# Check if anything is already running on port 3000
echo "Checking for processes on port 3000..."
lsof -i :3000

# Kill any processes running on port 3000
echo "Stopping any processes on port 3000..."
fuser -k 3000/tcp 2>/dev/null || echo "No processes to kill on port 3000"

# Check firewall settings
echo "Checking firewall settings..."
if command -v ufw &> /dev/null; then
    echo "UFW firewall status:"
    sudo ufw status | grep 3000 || echo "No specific rule for port 3000"
fi

if command -v iptables &> /dev/null; then
    echo "IPTables firewall rules for port 3000:"
    sudo iptables -L INPUT -n | grep 3000 || echo "No specific iptables rule for port 3000"
fi

# Try to start a simple HTTP server on port 3000 to test accessibility
echo "Testing port 3000 with a simple HTTP server..."
(python3 -m http.server 3000 &) 2>/dev/null
PID=$!

# Wait a moment
sleep 2

# Check if the server is accessible
curl -s http://localhost:3000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Port 3000 is now accessible on localhost"
else
    echo "❌ Port 3000 is still not accessible on localhost"
    echo "This might indicate a deeper network configuration issue"
fi

# Kill the test server
kill $PID 2>/dev/null

echo "Port access check complete"
