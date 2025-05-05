#!/bin/bash

echo "===== NETWORK DIAGNOSTICS FOR NEXT.JS APPLICATION ====="

echo -e "\n1. Checking network interfaces..."
ip addr show

echo -e "\n2. Checking if Next.js process is running..."
ps aux | grep -E 'node.*(next|server.js)' | grep -v grep

echo -e "\n3. Checking port usage (alternative to netstat)..."
echo "Port 3000:"
ss -tuln | grep ':3000'
echo "Port 3001:"
ss -tuln | grep ':3001'

echo -e "\n4. Testing connections..."
echo "Testing localhost:3000:"
curl -v http://localhost:3000 -m 2 2>&1 | grep -E 'Connected to|Failed to connect'
echo "Testing IP address with port 3000:"
curl -v http://$(hostname -I | awk '{print $1}'):3000 -m 2 2>&1 | grep -E 'Connected to|Failed to connect'

echo -e "\n5. Checking package.json configuration..."
grep -A 5 '"scripts"' package.json

echo -e "\n6. Checking next.config.js settings..."
cat next.config.js

echo -e "\n7. Checking disk space (in case of build issues)..."
df -h /

echo -e "\n8. Checking Node.js and npm versions..."
node -v
npm -v

echo -e "\n9. Checking memory usage..."
free -h

echo -e "\n10. Examining process list to find what's using network ports..."
lsof -i :3000 2>/dev/null || echo "No process found using port 3000"
lsof -i :3001 2>/dev/null || echo "No process found using port 3001"

echo -e "\n11. Checking firewall status..."
which iptables && sudo iptables -L | grep -E '3000|3001' || echo "iptables not found"

echo -e "\n12. Checking if Next.js app is actually running:"
pgrep -f "next" || echo "No Next.js process found"

echo -e "\n===== RECOMMENDED ACTIONS ====="
echo "1. Try starting Next.js manually:"
echo "   cd /opt/ah-main && npm run dev"
echo "2. If that doesn't work, try:"
echo "   cd /opt/ah-main && npx next dev -p 3000 -H 0.0.0.0"
echo "3. Ensure your package.json has the correct script configuration"
echo "4. Check if there's a proxy redirecting port 3000 to 3001"
echo "5. Try creating a custom server.js file (see below)"
