#!/bin/bash

# Check which version is currently active
if [ -f ./components/audio/ConversationUI.original.tsx ]; then
  echo "Simple version is active, switching to original..."
  mv ./components/audio/ConversationUI.tsx ./components/audio/ConversationUI.simple.tsx
  mv ./components/audio/ConversationUI.original.tsx ./components/audio/ConversationUI.tsx
  echo "Switched to original version."
else
  echo "Original version is active, switching to simple..."
  mv ./components/audio/ConversationUI.tsx ./components/audio/ConversationUI.original.tsx
  mv ./components/audio/ConversationUI.simple.tsx ./components/audio/ConversationUI.tsx
  echo "Switched to simple version."
fi
