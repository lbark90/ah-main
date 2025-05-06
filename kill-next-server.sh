#!/bin/bash

PORT=3000
echo "Investigating Next.js server running on port $PORT..."

# Get detailed info about the process
pid=$(sudo ss -tulpn | grep ":$PORT " | sed -E 's/.*pid=([0-9]+).*/\1/')
if [ -z "$pid" ]; then
  echo "No process found on port $PORT"
  exit 0
fi

echo "Found process with PID $pid on port $PORT"

# Get more details about the process
echo "Process details:"
sudo ps -p $pid -f
echo ""

# Check for parent process
ppid=$(sudo ps -o ppid= -p $pid)
echo "Parent process (PPID: $ppid):"
sudo ps -p $ppid -f
echo ""

# Check if PM2 is running this
if command -v pm2 &> /dev/null; then
  echo "Checking PM2 processes:"
  pm2 list
  echo "Attempting to stop all PM2 processes..."
  pm2 stop all 2>/dev/null
  sleep 2
fi

# Check if it's still running
if sudo ss -tulpn | grep ":$PORT " >/dev/null; then
  echo "Process is still running. Attempting to kill both process and parent..."
  sudo kill -9 $pid 2>/dev/null
  sudo kill -9 $ppid 2>/dev/null
  sleep 2
fi

# Final check
if sudo ss -tulpn | grep ":$PORT " >/dev/null; then
  echo "Process is still running on port $PORT after kill attempts."
  echo "You may need to reboot the system or investigate further."
  echo "Current process using port $PORT:"
  sudo ss -tulpn | grep ":$PORT"
  exit 1
else
  echo "Successfully freed port $PORT"
  exit 0
fi
