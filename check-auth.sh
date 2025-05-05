#!/bin/bash

echo "===== AUTHENTICATION DEBUG TOOL ====="

echo -e "\n1. Checking for active sessions:"
echo "HTTP Cookies:"
curl -s -I http://localhost:3000 | grep -i cookie

echo -e "\nCookie contents from browser:"
echo "Run this in browser console: document.cookie"

echo -e "\n2. User data in localStorage:"
echo "Run this in browser console: localStorage.getItem('aliveHereUser')"

echo -e "\n3. Testing API endpoints:"
echo "Profile endpoint:"
curl -s "http://localhost:3000/api/user/profile?userId=larrytest" | jq .

echo -e "\nLogin credentials endpoint:"
curl -s "http://localhost:3000/api/user/login_credentials?userId=larrytest" | jq .

echo -e "\n===== AUTHENTICATION DEBUG COMPLETE ====="
echo "If the API returns valid data but the UI still shows login required:"
echo "1. Try clearing your browser cache"
echo "2. Check browser console for errors"
echo "3. Try running a test login with:"
echo "curl -X POST -H \"Content-Type: application/json\" -d '{\"username\":\"larrytest\",\"password\":\"12345678\"}' http://localhost:3000/api/auth/login"
