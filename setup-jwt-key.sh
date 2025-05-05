#!/bin/bash

# This script helps set up the JWT_PRIVATE_KEY for webhook authentication

# Check if the JWT_PRIVATE_KEY environment variable is already set
if [ -n "$JWT_PRIVATE_KEY" ]; then
  echo "JWT_PRIVATE_KEY is already set in the environment."
  echo "Value: ${JWT_PRIVATE_KEY:0:20}...[truncated]"
else
  echo "JWT_PRIVATE_KEY is not set in the environment."
  
  # Check if there's a key file that can be used
  KEY_FILE="/opt/ah-main/webhook-private-key.pem"
  if [ -f "$KEY_FILE" ]; then
    echo "Found key file at $KEY_FILE"
    
    # Read the key file and format it properly
    KEY_CONTENT=$(cat "$KEY_FILE")
    
    # Export the key to environment
    export JWT_PRIVATE_KEY="$KEY_CONTENT"
    echo "Exported key from file to JWT_PRIVATE_KEY environment variable"
  else
    echo "No key file found at $KEY_FILE"
    echo "You need to set the JWT_PRIVATE_KEY environment variable manually"
    echo "or create a key file at $KEY_FILE"
  fi
fi

# Instructions for manual setup
echo ""
echo "To set the JWT_PRIVATE_KEY environment variable manually:"
echo "1. Edit your shell profile (~/.bashrc, ~/.bash_profile, etc.)"
echo "2. Add: export JWT_PRIVATE_KEY=\"your-private-key-content\""
echo "3. Source the profile: source ~/.bashrc"
echo ""
echo "For production use, add the environment variable to your deployment configuration."
