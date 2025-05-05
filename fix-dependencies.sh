#!/bin/bash

echo "Fixing framer-motion dependency..."
npm uninstall framer-motion
npm install framer-motion@10.16.4

echo "Dependencies fixed!"
