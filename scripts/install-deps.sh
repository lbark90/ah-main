#!/bin/bash

# Install dependencies properly
npm install
# If framer-motion is still needed and causing issues, reinstall it
npm install framer-motion@latest --save

# If you want to avoid using framer-motion completely
# npm uninstall framer-motion
