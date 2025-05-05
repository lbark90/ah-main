#!/bin/bash

echo "===== NETWORK DIAGNOSTICS ====="
echo -e "\n1. Network Interfaces:"
ip addr show | grep -E 'inet '

echo -e "\n2. DNS Resolution:"
nslookup localhost
nslookup $(hostname)

echo -e "\n3. Port Usage:"
echo "Checking for processes using port 3000:"
sudo lsof -i :3000
echo "Checking for processes using port 3001:"
sudo lsof -i :3001

echo -e "\n4. Connection Test:"
echo "Testing localhost:3000:"
curl -v http://localhost:3000 -m 2 2>&1 | grep -E 'Connected to|Failed to connect'
echo "Testing localhost:3001:"
curl -v http://localhost:3001 -m 2 2>&1 | grep -E 'Connected to|Failed to connect'

echo -e "\n5. Routing:"
netstat -rn

echo -e "\n6. Active Connections:"
netstat -tpn | grep -E '3000|3001'

echo -e "\n7. Environment:"
node -v
echo "Next.js version:" $(grep '"next":' package.json | cut -d'"' -f4)

echo -e "\n===== END DIAGNOSTICS ====="
