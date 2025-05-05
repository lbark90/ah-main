#!/bin/bash

echo "Checking package dependencies..."

echo "Core Next.js dependencies:"
npm list next react react-dom

echo "TypeScript dependencies:"
npm list typescript @types/react @types/node

echo "Tailwind dependencies:"
npm list tailwindcss postcss autoprefixer

echo "Checking for any broken dependencies..."
npm ls --json | grep -i "missing" || echo "✅ No missing dependencies found"

echo "Checking for dependency conflicts..."
npm ls --json | grep -i "invalid" || echo "✅ No dependency conflicts found"

echo "Checking node_modules:"
if [ -d "node_modules" ]; then
  echo "✅ node_modules directory exists"
else
  echo "❌ node_modules not found. Try running: npm install"
fi

echo "Dependency check complete"
