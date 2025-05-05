#!/bin/bash

# Install required dependencies
echo "Installing dependencies..."
npm install jsonwebtoken

# Directory for keys
KEY_DIR="/opt/ah-main/keys"
PRIVATE_KEY_PATH="$KEY_DIR/webhook_private.key"
PUBLIC_KEY_PATH="$KEY_DIR/webhook_public.key"

# Create keys directory if it doesn't exist
mkdir -p "$KEY_DIR"

# Check if OpenSSL is available
if command -v openssl &> /dev/null; then
  echo "Using OpenSSL to generate keys..."
  
  # Generate private key
  openssl genrsa -out "$PRIVATE_KEY_PATH" 2048
  
  # Generate public key
  openssl rsa -in "$PRIVATE_KEY_PATH" -pubout -out "$PUBLIC_KEY_PATH"
else
  echo "OpenSSL not found, using Node.js crypto instead..."
  node lib/generate_node_keys.js
fi

# Verify keys were created
if [ -f "$PRIVATE_KEY_PATH" ] && [ -f "$PUBLIC_KEY_PATH" ]; then
  echo "Keys generated successfully:"
  echo "- Private key: $PRIVATE_KEY_PATH"
  echo "- Public key: $PUBLIC_KEY_PATH"
  
  # Set up the environment variable
  export JWT_PRIVATE_KEY=$(cat "$PRIVATE_KEY_PATH" | tr '\n' '\\n')
  echo "JWT_PRIVATE_KEY is now set for this session"
  
  # Test JWT signing with the key
  echo "Testing JWT signing with the generated key..."
  node -e "
  try {
    const jwt = require('jsonwebtoken');
    const fs = require('fs');
    const privateKey = fs.readFileSync('$PRIVATE_KEY_PATH', 'utf8');
    const token = jwt.sign({test: true}, privateKey, {algorithm: 'RS256'});
    console.log('✅ JWT signing test successful!');
  } catch (e) {
    console.error('❌ JWT signing test failed:', e.message);
    process.exit(1);
  }
  "
  
  if [ $? -eq 0 ]; then
    echo "Key verification passed!"
  else
    echo "Key verification failed. Please check the key format."
    exit 1
  fi
else
  echo "Error: Failed to generate keys"
  exit 1
fi

echo ""
echo "====== NEXT STEPS ======"
echo "1. Share the public key with the webhook service administrator:"
cat "$PUBLIC_KEY_PATH"
echo ""
echo "2. They need to update their verification key to match this new key"
echo "3. Once they confirm the update, your webhooks should work correctly"
echo ""
echo "To test the webhook immediately, run:"
echo "node lib/debug_webhook.js"
