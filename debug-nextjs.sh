#!/bin/bash

echo "Checking Next.js Environment..."
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

echo "Verifying package.json..."
if [ -f "package.json" ]; then
  echo "✅ package.json exists"
else
  echo "❌ package.json not found!"
  exit 1
fi

echo "Checking next.config.js..."
if [ -f "next.config.js" ]; then
  echo "✅ next.config.js exists"
else
  echo "❌ next.config.js not found!"
fi

echo "Checking for required dependencies..."
npm list next react react-dom typescript @types/react > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Core dependencies installed"
else
  echo "❌ Some core dependencies may be missing"
  echo "Try running: npm install"
fi

echo "Checking app folder structure..."
if [ -d "app" ]; then
  echo "✅ app directory exists"
  if [ -f "app/page.tsx" ]; then
    echo "✅ app/page.tsx exists"
  else
    echo "❌ app/page.tsx not found!"
  fi
else
  echo "❌ app directory not found!"
fi

echo "Checking for syntax errors in TypeScript files..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
  echo "✅ No TypeScript errors found"
else
  echo "❌ TypeScript errors found"
fi

echo "Checking browser network connectivity..."
echo "Try accessing the following URLs in your browser:"
echo "- http://localhost:3000"
echo "- http://$(hostname -I | awk '{print $1}'):3000"
echo "- http://0.0.0.0:3000"

echo "Checking for firewall issues..."
nc -z localhost 3000
if [ $? -eq 0 ]; then
  echo "✅ Port 3000 is open on localhost"
else
  echo "❌ Port 3000 is not accessible on localhost"
fi

echo "Debug information complete"
