#!/bin/bash

echo "=== Network Interface Info ==="
ip addr show

echo -e "\n=== Checking Port Usage ==="
lsof -i :3000
netstat -tulpn 2>/dev/null | grep 3000

echo -e "\n=== Testing Local Connection ==="
curl -v http://localhost:3000 -m 5

echo -e "\n=== Checking Node.js Version ==="
node -v

echo -e "\n=== Checking Next.js Info ==="
grep "\"next\":" package.json
